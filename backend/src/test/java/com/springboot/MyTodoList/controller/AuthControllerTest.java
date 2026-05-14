package com.springboot.MyTodoList.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import com.springboot.MyTodoList.service.ToDoItemService;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private ToDoItemService toDoItemService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Usuario> usuarioCaptor;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AuthController controller = new AuthController();
        ReflectionTestUtils.setField(controller, "toDoItemService", toDoItemService);
        ReflectionTestUtils.setField(controller, "usuarioRepository", usuarioRepository);
        ReflectionTestUtils.setField(controller, "passwordEncoder", passwordEncoder);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).setValidator(noOpValidator()).build();
    }

    @Test
    void getCurrentUserReturnsProfileFromMockedService() throws Exception {
        when(toDoItemService.getUserProfile("fernanda")).thenReturn(usuario(7, "fernanda", "Fernanda Jimenez", "developer", "activo"));

        mockMvc.perform(get("/auth/me").param("username", "fernanda"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("fernanda"))
            .andExpect(jsonPath("$.nombre").value("Fernanda Jimenez"))
            .andExpect(jsonPath("$.rol").value("developer"));

        verify(toDoItemService).getUserProfile("fernanda");
    }

    @Test
    void loginReturnsSessionWhenPasswordMatches() throws Exception {
        Usuario user = usuario(8, "fernanda.admin", "Fernanda Admin", "admin", "activo");
        user.setPasswordHash("encoded-password");
        when(usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc("fernanda.admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "encoded-password")).thenReturn(true);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "fernanda.admin", "password", "secret123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("fernanda.admin"))
            .andExpect(jsonPath("$.role").value("admin"));
    }

    @Test
    void loginRejectsInvalidPasswordWithoutDatabaseSideEffects() throws Exception {
        Usuario user = usuario(9, "fernanda", "Fernanda Jimenez", "developer", "activo");
        user.setPasswordHash("encoded-password");
        when(usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc("fernanda")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("username", "fernanda", "password", "wrong-password"))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Credenciales inválidas"));
    }

    @Test
    void registerCreatesDeveloperUserWithEncodedPassword() throws Exception {
        when(usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc("nuevo")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario saved = invocation.getArgument(0);
            saved.setIdUsuario(31);
            return saved;
        });

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "name", "Nuevo Dev",
                    "username", "nuevo",
                    "password", "secret123",
                    "role", "developer"
                ))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(31))
            .andExpect(jsonPath("$.username").value("nuevo"))
            .andExpect(jsonPath("$.role").value("developer"));

        verify(usuarioRepository).save(usuarioCaptor.capture());
        Usuario savedUser = usuarioCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isEqualTo("encoded-secret");
        assertThat(savedUser.getEstado()).isEqualTo("activo");
    }

    private Usuario usuario(int id, String username, String nombre, String rol, String estado) {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(id);
        usuario.setUsername(username);
        usuario.setNombre(nombre);
        usuario.setRol(rol);
        usuario.setEstado(estado);
        return usuario;
    }

    private Validator noOpValidator() {
        return new Validator() {
            @Override
            public boolean supports(Class<?> clazz) {
                return true;
            }

            @Override
            public void validate(Object target, Errors errors) {
            }
        };
    }
}
