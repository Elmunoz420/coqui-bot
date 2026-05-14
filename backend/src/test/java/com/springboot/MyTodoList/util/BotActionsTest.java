package com.springboot.MyTodoList.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.ToDoItemService;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@ExtendWith(MockitoExtension.class)
class BotActionsTest {

    private static final long CHAT_ID = 12345L;

    @Mock
    private TelegramClient telegramClient;

    @Mock
    private ToDoItemService todoService;

    @Mock
    private DeepSeekService deepSeekService;

    @Captor
    private ArgumentCaptor<ToDoItem> todoItemCaptor;

    @Captor
    private ArgumentCaptor<SendMessage> sendMessageCaptor;

    @Test
    void createsSimpleTaskWithoutTelegramOrDatabase() throws Exception {
        BotActions actions = actionsFor("Preparar demo final");

        actions.fnElse();

        verify(todoService, times(1)).addToDoItem(todoItemCaptor.capture());
        ToDoItem createdTask = todoItemCaptor.getValue();
        assertThat(createdTask.getDescription()).isEqualTo("Preparar demo final");
        assertThat(createdTask.getDescripcion()).isEmpty();
        assertThat(createdTask.getPrioridad()).isEqualTo("media");
        assertThat(createdTask.isDone()).isFalse();

        SendMessage message = sentMessage();
        assertThat(message.getChatId()).isEqualTo(String.valueOf(CHAT_ID));
        assertThat(message.getText()).contains("Nueva tarea");
    }

    @Test
    void createsRichTaskFromPipeSeparatedMessage() throws Exception {
        BotActions actions = actionsFor("Preparar demo | Evidencia de unit tests | ALTA | 2026-05-20 | 3");

        actions.fnElse();

        verify(todoService, times(1)).addToDoItem(todoItemCaptor.capture());
        ToDoItem createdTask = todoItemCaptor.getValue();
        assertThat(createdTask.getDescription()).isEqualTo("Preparar demo");
        assertThat(createdTask.getDescripcion()).isEqualTo("Evidencia de unit tests");
        assertThat(createdTask.getPrioridad()).isEqualTo("alta");
        assertThat(createdTask.getFechaLimite()).isNotNull();
        assertThat(createdTask.getFechaLimite().toLocalDate()).isEqualTo(LocalDate.of(2026, 5, 20));
        assertThat(createdTask.getHorasEstimadas()).isEqualTo(3.0);
        assertThat(createdTask.isDone()).isFalse();

        assertThat(sentMessage().getText()).contains("Nueva tarea");
    }

    @Test
    void listsActiveAndCompletedTasks() throws Exception {
        ToDoItem activeTask = task(101, "Preparar demo final", false);
        activeTask.setPrioridad("alta");
        activeTask.setHorasEstimadas(2.5);

        ToDoItem completedTask = task(102, "Documentar evidencias", true);
        when(todoService.findAll()).thenReturn(List.of(activeTask, completedTask));

        BotActions actions = actionsFor(BotCommands.TODO_LIST.getCommand());

        actions.fnListAll();

        verify(todoService, times(1)).findAll();
        SendMessage message = sentMessage();
        assertThat(message.getChatId()).isEqualTo(String.valueOf(CHAT_ID));
        assertThat(message.getText())
                .contains("Active Tasks")
                .contains("Completed Tasks")
                .contains("Preparar demo final")
                .contains("~~Documentar evidencias~~");
    }

    @Test
    void marksTaskAsCompleted() throws Exception {
        ToDoItem task = task(101, "Preparar demo final", false);
        when(todoService.getToDoItemById(101)).thenReturn(task);

        BotActions actions = actionsFor("101-DONE");

        actions.fnDone();

        verify(todoService, times(1)).getToDoItemById(101);
        verify(todoService, times(1)).updateToDoItem(101, task);
        assertThat(task.isDone()).isTrue();
        assertThat(task.getEstado()).isEqualTo("completada");

        SendMessage message = sentMessage();
        assertThat(message.getChatId()).isEqualTo(String.valueOf(CHAT_ID));
        assertThat(message.getText()).contains("Tarea completada");
    }

    private BotActions actionsFor(String requestText) {
        BotActions actions = new BotActions(telegramClient, todoService, deepSeekService);
        actions.setChatId(CHAT_ID);
        actions.setRequestText(requestText);
        return actions;
    }

    private SendMessage sentMessage() throws Exception {
        verify(telegramClient, times(1)).execute(sendMessageCaptor.capture());
        return sendMessageCaptor.getValue();
    }

    private ToDoItem task(int id, String description, boolean done) {
        ToDoItem task = new ToDoItem();
        task.setID(id);
        task.setDescription(description);
        task.setDescripcion("");
        task.setPrioridad("media");
        task.setHorasEstimadas(0);
        task.setHorasReales(0);
        task.setDone(done);
        return task;
    }
}
