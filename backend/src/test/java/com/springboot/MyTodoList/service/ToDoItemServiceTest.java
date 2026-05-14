package com.springboot.MyTodoList.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.springboot.MyTodoList.model.Proyecto;
import com.springboot.MyTodoList.model.Tarea;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.repository.ProyectoRepository;
import com.springboot.MyTodoList.repository.TareaRepository;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ToDoItemServiceTest {

    @Mock
    private TareaRepository tareaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ProyectoRepository proyectoRepository;

    @InjectMocks
    private ToDoItemService service;

    @Captor
    private ArgumentCaptor<Tarea> tareaCaptor;

    private Usuario defaultUser;
    private Proyecto defaultProject;

    @BeforeEach
    void setUp() {
        defaultUser = usuario("coqui_bot_user", "Coqui Bot User", "admin");
        defaultProject = proyecto("COQUI BOT");
        ReflectionTestUtils.setField(service, "usuarioPorDefecto", defaultUser);
        ReflectionTestUtils.setField(service, "proyectoPorDefecto", defaultProject);
    }

    @Test
    void addToDoItemCreatesTareaWithDefaultsWithoutDatabase() {
        ToDoItem input = new ToDoItem();
        input.setDescription("Preparar demo");
        input.setDescripcion("Evidencia final");
        input.setPrioridad("alta");
        input.setHorasEstimadas(3.0);
        input.setSprint("Sprint 2");

        when(tareaRepository.save(any(Tarea.class))).thenAnswer(invocation -> {
            Tarea saved = invocation.getArgument(0);
            saved.setIdTarea(77);
            return saved;
        });

        ToDoItem result = service.addToDoItem(input);

        verify(tareaRepository).save(tareaCaptor.capture());
        Tarea savedTarea = tareaCaptor.getValue();
        assertThat(savedTarea.getTitulo()).isEqualTo("Preparar demo");
        assertThat(savedTarea.getDescripcion()).isEqualTo("Evidencia final");
        assertThat(savedTarea.getPrioridad()).isEqualTo("alta");
        assertThat(savedTarea.getEstado()).isEqualTo("pendiente");
        assertThat(savedTarea.getHorasEstimadas()).isEqualTo(3.0);
        assertThat(savedTarea.getSprint()).isEqualTo(2);
        assertThat(savedTarea.getUsuarioAsignado()).isEqualTo(defaultUser);
        assertThat(savedTarea.getProyecto()).isEqualTo(defaultProject);
        assertThat(result.getID()).isEqualTo(77);
        assertThat(result.getDescription()).isEqualTo("Preparar demo");
        assertThat(result.isDone()).isFalse();
    }

    @Test
    void findAllMapsTareaEntitiesToToDoItems() {
        Tarea pending = tarea(10, "Crear tarea", "pendiente", defaultUser);
        pending.setSprint(1);
        Tarea completed = tarea(11, "Cerrar sprint", "completada", defaultUser);
        completed.setHorasReales(4.0);

        when(tareaRepository.findAll()).thenReturn(List.of(pending, completed));

        List<ToDoItem> result = service.findAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getID()).isEqualTo(10);
        assertThat(result.get(0).getDescription()).isEqualTo("Crear tarea");
        assertThat(result.get(0).getSprint()).isEqualTo("Sprint 1");
        assertThat(result.get(0).isDone()).isFalse();
        assertThat(result.get(1).getDescription()).isEqualTo("Cerrar sprint");
        assertThat(result.get(1).isDone()).isTrue();
        assertThat(result.get(1).getHorasReales()).isEqualTo(4.0);
    }

    @Test
    void updateToDoItemMarksExistingTareaAsCompleted() {
        Tarea existing = tarea(25, "Validar demo", "pendiente", defaultUser);
        ToDoItem update = new ToDoItem();
        update.setDone(true);
        update.setHorasReales(2.5);

        when(tareaRepository.findById(25)).thenReturn(Optional.of(existing));
        when(tareaRepository.save(any(Tarea.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ToDoItem result = service.updateToDoItem(25, update);

        verify(tareaRepository).save(tareaCaptor.capture());
        Tarea savedTarea = tareaCaptor.getValue();
        assertThat(savedTarea.getEstado()).isEqualTo("completada");
        assertThat(savedTarea.getFechaCierre()).isNotNull();
        assertThat(savedTarea.getHorasReales()).isEqualTo(2.5);
        assertThat(result.isDone()).isTrue();
    }

    private Tarea tarea(int id, String titulo, String estado, Usuario assignedUser) {
        Tarea tarea = new Tarea();
        tarea.setIdTarea(id);
        tarea.setTitulo(titulo);
        tarea.setDescripcion("");
        tarea.setPrioridad("media");
        tarea.setEstado(estado);
        tarea.setFechaCreacion(OffsetDateTime.now());
        tarea.setHorasEstimadas(0.0);
        tarea.setHorasReales(0.0);
        tarea.setUsuarioAsignado(assignedUser);
        tarea.setProyecto(defaultProject);
        return tarea;
    }

    private Usuario usuario(String username, String nombre, String rol) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setNombre(nombre);
        usuario.setRol(rol);
        usuario.setEstado("activo");
        return usuario;
    }

    private Proyecto proyecto(String nombre) {
        Proyecto proyecto = new Proyecto();
        proyecto.setNombre(nombre);
        proyecto.setEstado("activo");
        return proyecto;
    }
}
