package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import com.springboot.MyTodoList.service.ToDoItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Map;

@RestController
public class AuthController {

    @Autowired
    private ToDoItemService toDoItemService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping(value = "/auth/me")
    public ResponseEntity<Usuario> getCurrentUser(
        @RequestParam(value = "username", defaultValue = "fernanda") String username
    ) {
        Usuario usuario = toDoItemService.getUserProfile(username);
        return new ResponseEntity<>(usuario, HttpStatus.OK);
    }

    @PostMapping(value = "/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password() == null ? "" : request.password();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuario y contraseña son requeridos"));
        }

        Usuario usuario = usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(username).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Credenciales inválidas"));
        }

        return authenticate(usuario, password);
    }

    @PostMapping(value = "/auth/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password() == null ? "" : request.password();
        String name = request.name() == null ? "" : request.name().trim();

        if (username.isEmpty() || password.isEmpty() || name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre, usuario y contraseña son requeridos"));
        }

        if (password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "La contraseña debe tener al menos 6 caracteres"));
        }

        Usuario usuario = usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(username).orElse(null);
        if (usuario != null) {
            if (usuario.getPasswordHash() != null && !usuario.getPasswordHash().isBlank()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Ese usuario ya tiene una cuenta activa"));
            }

            usuario.setNombre(name);
            usuario.setPasswordHash(passwordEncoder.encode(password));
            if (usuario.getEstado() == null || usuario.getEstado().isBlank()) {
                usuario.setEstado("activo");
            }
            usuarioRepository.save(usuario);
            return ResponseEntity.status(HttpStatus.CREATED).body(UserSession.from(usuario));
        }

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(name);
        nuevoUsuario.setUsername(username);
        nuevoUsuario.setRol(normalizeRequestedRole(request.role()));
        nuevoUsuario.setEstado("activo");
        nuevoUsuario.setFechaRegistro(OffsetDateTime.now());
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(password));

        Usuario saved = usuarioRepository.save(nuevoUsuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserSession.from(saved));
    }

    private ResponseEntity<?> authenticate(Usuario usuario, String password) {
        if (!isActive(usuario)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Usuario inactivo"));
        }

        String passwordHash = usuario.getPasswordHash();
        if (passwordHash == null || passwordHash.isBlank() || !passwordEncoder.matches(password, passwordHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Credenciales inválidas"));
        }

        return ResponseEntity.ok(UserSession.from(usuario));
    }

    private boolean isActive(Usuario usuario) {
        String estado = usuario.getEstado();
        if (estado == null || estado.isBlank()) return true;
        String normalized = estado.toLowerCase(Locale.ROOT);
        return normalized.equals("activo") || normalized.equals("active");
    }

    private String normalizeRequestedRole(String role) {
        if (role == null || role.isBlank()) return "developer";
        String normalized = role.toLowerCase(Locale.ROOT);
        if (normalized.equals("admin") || normalized.equals("administrador")) return "admin";
        return "developer";
    }

    public record LoginRequest(String username, String password) {}

    public record RegisterRequest(String name, String username, String password, String role) {}

    public record UserSession(int id, String username, String name, String role, String status) {
        public static UserSession from(Usuario usuario) {
            return new UserSession(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getNombre(),
                normalizeRole(usuario.getRol()),
                usuario.getEstado()
            );
        }

        private static String normalizeRole(String role) {
            if (role == null || role.isBlank()) return "developer";
            String normalized = role.toLowerCase(Locale.ROOT);
            if (normalized.equals("admin") || normalized.equals("administrador")) return "admin";
            return "developer";
        }
    }
}
