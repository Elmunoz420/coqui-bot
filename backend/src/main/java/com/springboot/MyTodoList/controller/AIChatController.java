package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/ai")
public class AIChatController {

    @Autowired
    private ToDoItemService toDoItemService;

    @Value("${anthropic.api.key:}")
    private String anthropicApiKey;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String userMessage = body.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message is required"));
        }

        List<ToDoItem> tasks = toDoItemService.findAll();
        StringBuilder context = new StringBuilder();
        context.append("Eres Coqui, el asistente del equipo COQUI BOT. Cuando te presentes o te refieras a ti mismo, usa el nombre Coqui. ");
        context.append("Responde SIEMPRE en español, de forma muy corta y directa (máximo 2 oraciones). ");
        context.append("NUNCA uses asteriscos, negritas, markdown, bullets ni símbolos especiales. Solo texto plano. ");
        context.append("Sé amigable y casual, como si hablaras con un compañero de equipo. ");
        context.append("Aquí están las tareas actuales del equipo:\n\n");

        for (ToDoItem task : tasks) {
            context.append(String.format("- ID:%d | %s | Asignado: %s | Estado: %s | Prioridad: %s | Sprint: %s | Horas estimadas: %.1f | Horas reales: %.1f\n",
                task.getID(),
                task.getDescription() != null ? task.getDescription() : "Sin título",
                task.getAssignedUser() != null ? task.getAssignedUser() : "Sin asignar",
                task.getEstado() != null ? task.getEstado() : "pendiente",
                task.getPrioridad() != null ? task.getPrioridad() : "media",
                task.getSprint() != null ? task.getSprint() : "-",
                task.getHorasEstimadas(),
                task.getHorasReales()
            ));
        }



        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", anthropicApiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-haiku-4-5-20251001");
        requestBody.put("max_tokens", 1024);
        requestBody.put("system", context.toString());
        requestBody.put("messages", List.of(Map.of("role", "user", "content", userMessage)));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.anthropic.com/v1/messages",
                request,
                Map.class
            );
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            String reply = (String) content.get(0).get("text");
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al contactar la IA: " + e.getMessage()));
        }
    }
}
