package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.model.Tarea;
import com.springboot.MyTodoList.model.Usuario;
import com.springboot.MyTodoList.model.Proyecto;
import com.springboot.MyTodoList.repository.TareaRepository;
import com.springboot.MyTodoList.repository.UsuarioRepository;
import com.springboot.MyTodoList.repository.ProyectoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio que mantiene la interfaz pública original (ToDoItem)
 * pero ahora lee/escribe en la tabla TAREA de Oracle.
 * Capa de compatibilidad: convierte Tarea <-> ToDoItem.
 */
@Service
public class ToDoItemService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProyectoRepository proyectoRepository;

    private Usuario usuarioPorDefecto;
    private Proyecto proyectoPorDefecto;

    /**
     * Asegura que existan el usuario y proyecto por defecto
     * para satisfacer las foreign keys de TAREA.
     */
    @PostConstruct
    public void initDefaults() {
        usuarioPorDefecto = usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc("coqui_bot_user")
            .orElseGet(() -> {
                Usuario u = new Usuario();
                u.setNombre("Coqui Bot User");
                u.setUsername("coqui_bot_user");
                u.setRol("admin");
                u.setEstado("activo");
                u.setFechaRegistro(OffsetDateTime.now());
                return usuarioRepository.save(u);
            });

        proyectoPorDefecto = proyectoRepository.findByNombre("COQUI BOT")
            .orElseGet(() -> {
                Proyecto p = new Proyecto();
                p.setNombre("COQUI BOT");
                p.setDescripcion("Proyecto principal de tareas de COQUI BOT");
                p.setEstado("activo");
                p.setFechaCreacion(OffsetDateTime.now());
                return proyectoRepository.save(p);
            });

        Arrays.asList(
            new String[] { "fernanda.admin", "Fernanda Jiménez", "admin" },
            new String[] { "fernanda", "Fernanda Jiménez", "developer" },
            new String[] { "joaquin", "Joaquín Hiroki", "developer" },
            new String[] { "esteban", "Esteban Muñoz", "developer" },
            new String[] { "juanpablo", "Juan Pablo Buenrostro", "developer" },
            new String[] { "emilio", "Emilio Pardo", "developer" }
        ).forEach(seed -> ensureUser(seed[0], seed[1], seed[2]));
    }

    private Usuario ensureUser(String username, String nombre, String rol) {
        return usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(username)
            .orElseGet(() -> {
                Usuario user = new Usuario();
                user.setUsername(username);
                user.setNombre(nombre);
                user.setRol(rol);
                user.setEstado("activo");
                user.setFechaRegistro(OffsetDateTime.now());
                return usuarioRepository.save(user);
            });
    }

    // ---- Conversión Tarea -> ToDoItem (compatibilidad frontend) ----

    private ToDoItem tareaToToDoItem(Tarea t) {
        ToDoItem item = new ToDoItem();
        item.setID(t.getIdTarea());
        item.setDescription(t.getTitulo());
        item.setDescripcion(t.getDescripcion());
        item.setPrioridad(t.getPrioridad() != null ? t.getPrioridad() : "media");
        item.setEstado(t.getEstado() != null ? t.getEstado() : "pendiente");
        item.setCreation_ts(t.getFechaCreacion());
        item.setFechaLimite(t.getFechaLimite());
        item.setHorasEstimadas(t.getHorasEstimadas() != null ? t.getHorasEstimadas() : 0.0);
        item.setHorasReales(t.getHorasReales() != null ? t.getHorasReales() : 0.0);
        item.setSprint(t.getSprint() != null ? "Sprint " + t.getSprint() : null);
        item.setAssignedUser(t.getUsuarioAsignado() != null ? t.getUsuarioAsignado().getNombre() : null);

        boolean done = "completada".equalsIgnoreCase(t.getEstado())
                    || "done".equalsIgnoreCase(t.getEstado())
                    || "cerrada".equalsIgnoreCase(t.getEstado());
        item.setDone(done);
        return item;
    }

    private void applyToDoItemToTarea(ToDoItem td, Tarea tarea) {
        if (td.getDescription() != null) {
            tarea.setTitulo(td.getDescription());
        }
        if (td.getDescripcion() != null) {
            tarea.setDescripcion(td.getDescripcion());
        }
        if (td.getPrioridad() != null) {
            tarea.setPrioridad(td.getPrioridad());
        }
        if (td.getFechaLimite() != null) {
            tarea.setFechaLimite(td.getFechaLimite());
        }
        if (td.getHorasEstimadas() > 0) {
            tarea.setHorasEstimadas((double) td.getHorasEstimadas());
        }
        if (td.getHorasReales() >= 0) {
            tarea.setHorasReales((double) td.getHorasReales());
        }
        if (td.getSprint() != null) {
            tarea.setSprint(parseSprint(td.getSprint()));
        }
        if (td.getAssignedUser() != null && !td.getAssignedUser().isBlank()) {
            tarea.setUsuarioAsignado(resolveAssignedUser(td.getAssignedUser()));
        }
        // Actualizar estado basado en done
        if (td.isDone()) {
            tarea.setEstado("completada");
            if (tarea.getFechaCierre() == null) {
                tarea.setFechaCierre(OffsetDateTime.now());
            }
        } else {
            tarea.setEstado("pendiente");
            tarea.setFechaCierre(null);
        }
    }

    private Usuario resolveAssignedUser(String assignedUser) {
        if (assignedUser == null || assignedUser.isBlank()) {
            return usuarioPorDefecto;
        }

        String primaryValue = assignedUser.split(",")[0].trim();
        return usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(primaryValue)
            .or(() -> usuarioRepository.findFirstByNombreIgnoreCaseOrderByIdUsuarioAsc(primaryValue))
            .orElseGet(() -> {
                String firstName = primaryValue.split(" ")[0].trim();
                return usuarioRepository.findAll().stream()
                    .filter(user -> user.getNombre() != null && user.getNombre().toLowerCase().startsWith(firstName.toLowerCase()))
                    .findFirst()
                    .orElse(usuarioPorDefecto);
            });
    }

    // ---- API pública (misma firma que antes) ----

    public List<ToDoItem> findAll() {
        return tareaRepository.findAll().stream()
                .map(this::tareaToToDoItem)
                .collect(Collectors.toList());
    }

    public List<ToDoItem> findAssignedToUsername(String username) {
        return tareaRepository.findByUsuarioAsignado_UsernameIgnoreCase(username).stream()
                .map(this::tareaToToDoItem)
                .collect(Collectors.toList());
    }

    public Usuario getUserProfile(String username) {
        return usuarioRepository.findFirstByUsernameIgnoreCaseOrderByIdUsuarioAsc(username)
                .orElse(usuarioPorDefecto);
    }

    public ResponseEntity<ToDoItem> getItemById(int id) {
        Optional<Tarea> data = tareaRepository.findById(id);
        if (data.isPresent()) {
            return new ResponseEntity<>(tareaToToDoItem(data.get()), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ToDoItem getToDoItemById(int id) {
        Optional<Tarea> data = tareaRepository.findById(id);
        return data.map(this::tareaToToDoItem).orElse(null);
    }

    public ToDoItem addToDoItem(ToDoItem toDoItem) {
        Tarea tarea = new Tarea();
        tarea.setTitulo(toDoItem.getDescription() != null ? toDoItem.getDescription() : "Sin título");
        tarea.setDescripcion(toDoItem.getDescripcion() != null ? toDoItem.getDescripcion() : "");
        tarea.setPrioridad(toDoItem.getPrioridad() != null ? toDoItem.getPrioridad() : "media");
        tarea.setEstado("pendiente");
        tarea.setFechaCreacion(OffsetDateTime.now());
        tarea.setFechaLimite(toDoItem.getFechaLimite());
        tarea.setHorasEstimadas(toDoItem.getHorasEstimadas() > 0 ? (double) toDoItem.getHorasEstimadas() : 0.0);
        tarea.setHorasReales(toDoItem.getHorasReales() >= 0 ? (double) toDoItem.getHorasReales() : 0.0);
        tarea.setSprint(parseSprint(toDoItem.getSprint()));
        tarea.setUsuarioAsignado(resolveAssignedUser(toDoItem.getAssignedUser()));
        tarea.setProyecto(proyectoPorDefecto);
        Tarea saved = tareaRepository.save(tarea);
        return tareaToToDoItem(saved);
    }

    public boolean deleteToDoItem(int id) {
        try {
            tareaRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public ToDoItem updateToDoItem(int id, ToDoItem td) {
        Optional<Tarea> tareaData = tareaRepository.findById(id);
        if (tareaData.isPresent()) {
            Tarea tarea = tareaData.get();
            applyToDoItemToTarea(td, tarea);
            Tarea saved = tareaRepository.save(tarea);
            return tareaToToDoItem(saved);
        } else {
            return null;
        }
    }

    private Integer parseSprint(String sprint) {
        if (sprint == null) return null;
        try {
            return Integer.parseInt(sprint.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return null;
        }
    }

}