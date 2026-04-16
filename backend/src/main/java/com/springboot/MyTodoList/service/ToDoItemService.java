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
        usuarioPorDefecto = usuarioRepository.findByUsername("coqui_bot_user")
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

    // ---- API pública (misma firma que antes) ----

    public List<ToDoItem> findAll() {
        return tareaRepository.findAll().stream()
                .map(this::tareaToToDoItem)
                .collect(Collectors.toList());
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
        tarea.setUsuarioAsignado(usuarioPorDefecto);
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
}
