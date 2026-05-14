package com.springboot.MyTodoList.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.ToDoItemService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

@ExtendWith(MockitoExtension.class)
class ToDoItemControllerTest {

    @Mock
    private ToDoItemService toDoItemService;

    @Captor
    private ArgumentCaptor<ToDoItem> toDoItemCaptor;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        ToDoItemController controller = new ToDoItemController();
        ReflectionTestUtils.setField(controller, "toDoItemService", toDoItemService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).setValidator(noOpValidator()).build();
    }

    @Test
    void getAllToDoItemsReturnsTasksFromMockedService() throws Exception {
        when(toDoItemService.findAll()).thenReturn(List.of(task(1, "Crear tarea", false), task(2, "Cerrar sprint", true)));

        mockMvc.perform(get("/todolist"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].description").value("Crear tarea"))
            .andExpect(jsonPath("$[1].done").value(true));

        verify(toDoItemService).findAll();
    }

    @Test
    void getAssignedTasksUsesUsernameQueryParameter() throws Exception {
        when(toDoItemService.findAssignedToUsername("fernanda")).thenReturn(List.of(task(3, "Validar UI", false)));

        mockMvc.perform(get("/todolist/my").param("username", "fernanda"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].description").value("Validar UI"));

        verify(toDoItemService).findAssignedToUsername("fernanda");
    }

    @Test
    void postToDoItemCreatesTaskAndReturnsLocationHeader() throws Exception {
        ToDoItem created = task(44, "Nueva tarea", false);
        when(toDoItemService.addToDoItem(any(ToDoItem.class))).thenReturn(created);

        mockMvc.perform(post("/todolist")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(task(0, "Nueva tarea", false))))
            .andExpect(status().isOk())
            .andExpect(header().string("location", "44"))
            .andExpect(header().string("Access-Control-Expose-Headers", containsString("location")));

        verify(toDoItemService).addToDoItem(toDoItemCaptor.capture());
        assertThat(toDoItemCaptor.getValue().getDescription()).isEqualTo("Nueva tarea");
    }

    @Test
    void putToDoItemUpdatesTask() throws Exception {
        ToDoItem updated = task(9, "Actualizar tarea", true);
        when(toDoItemService.updateToDoItem(eq(9), any(ToDoItem.class))).thenReturn(updated);

        mockMvc.perform(put("/todolist/9")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updated)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(9))
            .andExpect(jsonPath("$.done").value(true));

        verify(toDoItemService).updateToDoItem(eq(9), toDoItemCaptor.capture());
        assertThat(toDoItemCaptor.getValue().isDone()).isTrue();
    }

    @Test
    void deleteToDoItemDeletesTask() throws Exception {
        when(toDoItemService.deleteToDoItem(5)).thenReturn(true);

        mockMvc.perform(delete("/todolist/5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").value(true));

        verify(toDoItemService).deleteToDoItem(5);
    }

    private ToDoItem task(int id, String description, boolean done) {
        ToDoItem task = new ToDoItem();
        task.setID(id);
        task.setDescription(description);
        task.setDescripcion("");
        task.setPrioridad("media");
        task.setDone(done);
        return task;
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
