package com.springboot.MyTodoList.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai/insights")
public class AIInsightsController {
    private static final Logger logger = LoggerFactory.getLogger(AIInsightsController.class);
    private static final TypeReference<Map<String, Object>> INSIGHT_RESPONSE_TYPE = new TypeReference<>() {};
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ToDoItemService toDoItemService;

    @Value("${anthropic.api.key:}")
    private String anthropicApiKey;

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminInsights() {
        List<ToDoItem> tasks = toDoItemService.findAll();
        String context = buildAdminContext(tasks);
        String prompt = "Analiza estas tareas del equipo y genera exactamente 3 bullets y un plan de optimización basado en los sprints anteriores. " +
            "Responde SOLO con un objeto JSON válido, sin markdown, sin ```json y sin texto extra. " +
            "Usa exactamente esta estructura: " +
            "{\"title\":\"Coqui suggestion\",\"subtitle\":\"Resumen ejecutivo del equipo.\",\"bullets\":[" +
            "{\"label\":\"Riesgo principal\",\"value\":\"...\"}," +
            "{\"label\":\"Sugerencia\",\"value\":\"...\"}," +
            "{\"label\":\"Próximo análisis\",\"value\":\"...\"}],\"optimizationPlan\":[" +
            "{\"title\":\"Ajuste del próximo sprint\",\"detail\":\"...\"}," +
            "{\"title\":\"Balance de carga\",\"detail\":\"...\"}," +
            "{\"title\":\"Mejora de flujo\",\"detail\":\"...\"}]}";
        return callClaude(context, prompt, buildDefaultOptimizationPlan(tasks, "el equipo"));
    }

    @GetMapping("/developer")
    public ResponseEntity<Map<String, Object>> getDeveloperInsights(@RequestParam String username) {
        List<ToDoItem> tasks = toDoItemService.findAll().stream()
            .filter(t -> t.getAssignedUser() != null &&
                t.getAssignedUser().toLowerCase().contains(username.toLowerCase()))
            .collect(Collectors.toList());
        String context = buildDevContext(tasks, username);
        String prompt = "Analiza las tareas de este desarrollador y genera exactamente 3 bullets y un plan de optimización basado en sus sprints anteriores. " +
            "Responde SOLO con un objeto JSON válido, sin markdown, sin ```json y sin texto extra. " +
            "Usa exactamente esta estructura: " +
            "{\"title\":\"Coqui suggestion\",\"subtitle\":\"Recomendaciones personales.\",\"bullets\":[" +
            "{\"label\":\"Prioridad sugerida\",\"value\":\"...\"}," +
            "{\"label\":\"Atención requerida\",\"value\":\"...\"}," +
            "{\"label\":\"Consejo del día\",\"value\":\"...\"}],\"optimizationPlan\":[" +
            "{\"title\":\"Foco del siguiente sprint\",\"detail\":\"...\"}," +
            "{\"title\":\"Estimación\",\"detail\":\"...\"}," +
            "{\"title\":\"Ritmo de entrega\",\"detail\":\"...\"}]}";
        return callClaude(context, prompt, buildDefaultOptimizationPlan(tasks, username));
    }

    private String buildAdminContext(List<ToDoItem> tasks) {
        long completed = tasks.stream().filter(ToDoItem::isDone).count();
        long pending = tasks.stream().filter(t -> !t.isDone()).count();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Total tareas: %d. Completadas: %d. Pendientes: %d.\n", tasks.size(), completed, pending));
        sb.append(buildSprintSummary(tasks));
        tasks.forEach(t -> sb.append(String.format("- %s | %s | %s | %s | sprint:%s\n",
            t.getDescription(), t.getAssignedUser(), t.getEstado(), t.getPrioridad(), t.getSprint())));
        return sb.toString();
    }

    private String buildDevContext(List<ToDoItem> tasks, String username) {
        long completed = tasks.stream().filter(ToDoItem::isDone).count();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Desarrollador: %s. Tareas: %d. Completadas: %d.\n", username, tasks.size(), completed));
        sb.append(buildSprintSummary(tasks));
        tasks.forEach(t -> sb.append(String.format("- %s | %s | %s | sprint:%s | deadline:%s\n",
            t.getDescription(), t.getEstado(), t.getPrioridad(), t.getSprint(), t.getFechaLimite())));
        return sb.toString();
    }

    private String buildSprintSummary(List<ToDoItem> tasks) {
        Map<String, List<ToDoItem>> tasksBySprint = tasks.stream()
            .collect(Collectors.groupingBy(task -> {
                String sprint = task.getSprint();
                return sprint == null || sprint.isBlank() ? "Sin sprint" : sprint;
            }, TreeMap::new, Collectors.toList()));

        StringBuilder sb = new StringBuilder("Resumen por sprint:\n");
        tasksBySprint.forEach((sprint, sprintTasks) -> {
            long sprintCompleted = sprintTasks.stream().filter(ToDoItem::isDone).count();
            long highPriority = sprintTasks.stream()
                .filter(task -> task.getPrioridad() != null && task.getPrioridad().equalsIgnoreCase("alta"))
                .count();
            double estimatedHours = sprintTasks.stream().mapToDouble(ToDoItem::getHorasEstimadas).sum();
            double realHours = sprintTasks.stream().mapToDouble(ToDoItem::getHorasReales).sum();
            sb.append(String.format(
                "- %s: total=%d, completadas=%d, pendientes=%d, prioridad_alta=%d, horas_estimadas=%.1f, horas_reales=%.1f\n",
                sprint,
                sprintTasks.size(),
                sprintCompleted,
                sprintTasks.size() - sprintCompleted,
                highPriority,
                estimatedHours,
                realHours
            ));
        });
        return sb.toString();
    }

    private List<Map<String, String>> buildDefaultOptimizationPlan(List<ToDoItem> tasks, String owner) {
        long total = tasks.size();
        long completed = tasks.stream().filter(ToDoItem::isDone).count();
        long pending = total - completed;
        long highPriority = tasks.stream()
            .filter(task -> task.getPrioridad() != null && task.getPrioridad().equalsIgnoreCase("alta"))
            .count();

        return List.of(
            Map.of(
                "title", "Ajustar alcance",
                "detail", String.format("Revisar %d tareas pendientes de %s y mover lo no crítico al siguiente sprint.", pending, owner)
            ),
            Map.of(
                "title", "Balancear prioridad",
                "detail", String.format("Atender primero %d tareas de prioridad alta y evitar abrir trabajo nuevo hasta estabilizar el sprint.", highPriority)
            ),
            Map.of(
                "title", "Aprender del histórico",
                "detail", String.format("Usar el ritmo de %d tareas completadas para estimar capacidad real antes de planear el próximo sprint.", completed)
            )
        );
    }

    private ResponseEntity<Map<String, Object>> callClaude(String context, String prompt, List<Map<String, String>> defaultPlan) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", anthropicApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-haiku-4-5-20251001");
        requestBody.put("max_tokens", 1200);
        requestBody.put("system", "Eres Coqui, asistente de gestión de proyectos. " + context);
        requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        try {
            Object responseBody = restTemplate.postForObject(
                "https://api.anthropic.com/v1/messages",
                new HttpEntity<>(requestBody, headers),
                Object.class
            );
            Map<String, Object> responseMap = objectMapper.convertValue(responseBody, INSIGHT_RESPONSE_TYPE);
            String json = extractJsonObject(extractClaudeText(responseMap));
            Map<String, Object> result = objectMapper.readValue(json, INSIGHT_RESPONSE_TYPE);
            normalizeInsightResponse(result, defaultPlan);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.warn("Could not generate AI insight", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("title", "Coqui suggestion");
            fallback.put("subtitle", "No se pudo generar el análisis.");
            fallback.put("bullets", List.of(
                Map.of("label", "Estado", "value", "IA no disponible temporalmente.")
            ));
            fallback.put("optimizationPlan", defaultPlan);
            return ResponseEntity.ok(fallback);
        }
    }

    private String extractClaudeText(Map<String, Object> responseBody) {
        if (responseBody == null) {
            throw new IllegalStateException("Anthropic response body is empty");
        }

        Object contentObject = responseBody.get("content");
        if (!(contentObject instanceof List<?> content) || content.isEmpty()) {
            throw new IllegalStateException("Anthropic response did not include content");
        }

        Object firstBlock = content.get(0);
        if (!(firstBlock instanceof Map<?, ?> block)) {
            throw new IllegalStateException("Anthropic content block has an unexpected format");
        }

        Object text = block.get("text");
        if (!(text instanceof String value) || value.isBlank()) {
            throw new IllegalStateException("Anthropic response text is empty");
        }

        return value.trim();
    }

    private String extractJsonObject(String text) throws JsonProcessingException {
        try {
            objectMapper.readTree(text);
            return text;
        } catch (JsonProcessingException ignored) {
            int start = text.indexOf('{');
            int end = text.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String candidate = text.substring(start, end + 1);
                objectMapper.readTree(candidate);
                return candidate;
            }
            throw ignored;
        }
    }

    private void normalizeInsightResponse(Map<String, Object> response, List<Map<String, String>> defaultPlan) {
        if (!(response.get("title") instanceof String)
            || !(response.get("subtitle") instanceof String)
            || !(response.get("bullets") instanceof List<?> bullets)
            || bullets.isEmpty()) {
            throw new IllegalStateException("AI insight response is missing required fields");
        }

        if (!(response.get("optimizationPlan") instanceof List<?> plan) || plan.isEmpty()) {
            response.put("optimizationPlan", defaultPlan);
        }
    }
}
