package com.springboot.MyTodoList.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

/*
    DTO de compatibilidad con el frontend.
    Ya no es entidad JPA — la tabla real ahora es TAREA.
    Se conserva la clase para no romper controladores ni bot.
    
    FASE 2: Expandido para exponer campos reales de TAREA
    - descripcion (descripción detallada)
    - prioridad (ALTA, MEDIA, BAJA)
    - fechaLimite (deadline)
    - horasEstimadas (effort estimation)
    - horasReales (actual effort)
    - estado (estado completo, no simplificado)
 */
// @Entity  — deshabilitado: ya no mapea a tabla TODOITEM
// @Table(name = "TODOITEM")
public class ToDoItem {
    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    int ID;
    String description;           // Mapea a TITULO (para compatibilidad)
    String descripcion;           // Mapea a DESCRIPCION (nuevo)
    String prioridad;             // Mapea a PRIORIDAD (nuevo)
    String estado;                // Mapea a ESTADO (nuevo, para no perder info)
    OffsetDateTime creation_ts;   // Mapea a FECHA_CREACION
    OffsetDateTime fechaLimite;   // Mapea a FECHA_LIMITE (nuevo)
    double horasEstimadas;        // Mapea a HORAS_ESTIMADAS (nuevo)
    double horasReales;           // Mapea a HORAS_REALES (nuevo)
    boolean done;                 // Inferido de ESTADO (para compatibilidad)
    Integer sprint;               // Mapea a SPRINT (nuevo)
    String assignedUser;          // Nombre del usuario asignado (calculado)
    
    public ToDoItem(){
    }

    public ToDoItem(int ID, String description, OffsetDateTime creation_ts, boolean done) {
        this.ID = ID;
        this.description = description;
        this.creation_ts = creation_ts;
        this.done = done;
        this.prioridad = "media";
        this.estado = done ? "completada" : "pendiente";
        this.horasEstimadas = 0;
        this.horasReales = 0;
    }

    @JsonProperty("id")
    public int getID() {
        return ID;
    }

    public void setID(int ID) {
        this.ID = ID;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    @JsonProperty("createdAt")
    public OffsetDateTime getCreation_ts() {
        return creation_ts;
    }

    public void setCreation_ts(OffsetDateTime creation_ts) {
        this.creation_ts = creation_ts;
    }

    @JsonProperty("fechaLimite")
    public OffsetDateTime getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(OffsetDateTime fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public double getHorasEstimadas() {
        return horasEstimadas;
    }

    public void setHorasEstimadas(double horasEstimadas) {
        this.horasEstimadas = horasEstimadas;
    }

    public double getHorasReales() {
        return horasReales;
    }

    public void setHorasReales(double horasReales) {
        this.horasReales = horasReales;
    }

    public Integer getSprint() { return sprint; }
    public void setSprint(Integer sprint) { this.sprint = sprint; }

    public String getAssignedUser() { return assignedUser; }
    public void setAssignedUser(String assignedUser) { this.assignedUser = assignedUser; }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
        // Sincronizar estado con done
        if (done) {
            this.estado = "completada";
        } else {
            this.estado = "pendiente";
        }
    }

    @Override
    public String toString() {
        return "ToDoItem{" +
                "ID=" + ID +
                ", description='" + description + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", prioridad='" + prioridad + '\'' +
                ", estado='" + estado + '\'' +
                ", creation_ts=" + creation_ts +
                ", fechaLimite=" + fechaLimite +
                ", horasEstimadas=" + horasEstimadas +
                ", horasReales=" + horasReales +
                ", done=" + done +
                ", sprint=" + sprint +
                ", assignedUser='" + assignedUser + '\'' +
                '}';
    }
}
