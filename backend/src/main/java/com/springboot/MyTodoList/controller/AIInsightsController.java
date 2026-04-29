package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;
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

    @Autowired
    private ToDoItemService toDoItemService;

    @Value("${anthropic.api.key:}")
    private String anthropicApiKey;

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminInsights() {
        List<ToDoItem> tasks = toDoItemService.findAll();
        String context = buildAdminContext(tasks);
        String prompt = "Analiza estas tareas del equipo y genera exactamente 3 bullets en JSON. " +
            "Responde SOLO con este JSON sin markdown ni texto extra: " +
            "{\"title\":\"Coqui suggestion\",\"subtitle\":\"Resumen ejecutivo del equipo.\",\"bullets\":[" +
            "{\"label\":\"Riesgo principal\",\"value\":\"...\"}," +
            "{\"label\":\"Sugerencia\",\"value\":\"...\"}," +
            "{\"label\":\"Próximo análisis\",\"value\":\"...\"}]}";
        return callClaude(context, prompt);
    }

    @GetMapping("/developer")
    public ResponseEntity<Map<String, Object>> getDeveloperInsights(@RequestParam String username) {
        List<ToDoItem> tasks = toDoItemService.findAll().stream()
            .filter(t -> t.getAssignedUser() != null &&
                t.getAssignedUser().toLowerCase().contains(username.toLowerCase()))
            .collect(Collectors.toList());
        String context = buildDevContext(tasks, username);
        String prompt = "Analiza las tareas de este desarrollador y genera exactamente 3 bullets en JSON. " +
            "Responde SOLO con este JSON sin markdown ni texto extra: " +
            "{\"title\":\"Coqui suggestion\",\"subtitle\":\"Recomendaciones personales.\",\"bullets\":[" +
            "{\"label\":\"Prioridad sugerida\",\"value\":\"...\"}," +
            "{\"label\":\"Atención requerida\",\"value\":\"...\"}," +
            "{\"label\":\"Consejo del día\",\"value\":\"...\"}]}";
        return callClaude(context, prompt);
    }

    private String buildAdminContext(List<ToDoItem> tasks) {
        long completed = tasks.stream().filter(ToDoItem::isDone).count();
        long pending = tasks.stream().filter(t -> !t.isDone()).count();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Total tareas: %d. Completadas: %d. Pendientes: %d.\n", tasks.size(), completed, pending));
        tasks.forEach(t -> sb.append(String.format("- %s | %s | %s | %s | sprint:%s\n",
            t.getDescription(), t.getAssignedUser(), t.getEstado(), t.getPrioridad(), t.getSprint())));
        return sb.toString();
    }

    private String buildDevContext(List<ToDoItem> tasks, String username) {
        long completed = tasks.stream().filter(ToDoItem::isDone).count();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Desarrollador: %s. Tareas: %d. Completadas: %d.\n", username, tasks.size(), completed));
        tasks.forEach(t -> sb.append(String.format("- %s | %s | %s | deadline:%s\n",
            t.getDescription(), t.getEstado(), t.getPrioridad(), t.getFechaLimite())));
        return sb.toString();
    }

    private ResponseEntity<Map<String, Object>> callClaude(String context, String prompt) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", anthropicApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-haiku-4-5-20251001");
        requestBody.put("max_tokens", 512);
        requestBody.put("system", "Eres Coqui, asistente de gestión de proyectos. " + context);
        requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.anthropic.com/v1/messages",
                new HttpEntity<>(requestBody, headers),
                Map.class
            );
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            String json = (String) content.get(0).get("text");
            // Parse the JSON string into a Map
            org.springframework.boot.json.JacksonJsonParser parser = new org.springframework.boot.json.JacksonJsonParser();
            Map<String, Object> result = parser.parseMap(json);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("title", "Coqui suggestion");
            fallback.put("subtitle", "No se pudo generar el análisis.");
            fallback.put("bullets", List.of(
                Map.of("label", "Estado", "value", "IA no disponible temporalmente.")
            ));
            return ResponseEntity.ok(fallback);
        }
    }
}
