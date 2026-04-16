package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	HELLO_MYTODO_BOT(
	"¡Hola! Soy COQUI BOT!\nEscribe una nueva tarea abajo y presiona enviar, o selecciona una opción:"),
	BOT_REGISTERED_STARTED("Bot registered and started succesfully!"),
	ITEM_DONE("¡Tarea completada! Selecciona /todolist para ver la lista de tareas, o /start para la pantalla principal."), 
	ITEM_UNDONE("Tarea reabierta. Selecciona /todolist para ver la lista de tareas, o /start para la pantalla principal."), 
	ITEM_DELETED("Tarea eliminada. Selecciona /todolist para ver la lista de tareas, o /start para la pantalla principal."),
	TYPE_NEW_TODO_ITEM("Escribe una nueva tarea abajo y presiona el botón de enviar."),
	NEW_ITEM_ADDED("¡Nueva tarea agregada! Selecciona /todolist para ver la lista, o /start para la pantalla principal."),
	BYE("Bye! Select /start to resume!");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
