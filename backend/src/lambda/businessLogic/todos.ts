import * as uuid from 'uuid'

import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../types/Todo'
import { TodoAccess } from '../dataLayer/todo'

const todoAccess = new TodoAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getTodosForUser(userId);
}

export async function getTodo(userId: string, todoId: string): Promise<TodoItem> {
  return todoAccess.getTodo(userId, todoId);
}

export async function updateTodo(userId: string, todoId: string, payload: UpdateTodoRequest) : Promise<void>{
  return todoAccess.updateTodo(userId, todoId, payload);
}

export async function updateTodoAttachment(userId: string, todoId: string, s3Key: string): Promise<void> {
  return todoAccess.updateTodoAttachment(userId, todoId, s3Key);
}

export async function removeTodoAttachment(userId: string, todoId: string): Promise<void> {
  return todoAccess.removeTodoAttachment(userId, todoId);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  return todoAccess.deleteTodo(userId, todoId);
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4();

  return await todoAccess.createTodo({
    todoId,
    userId,
    name: createTodoRequest.name,
    done: false,
    createdAt: new Date().toISOString(),
    dueDate: createTodoRequest.dueDate
  })
}

export async function todoExists(id: string): Promise<boolean> {
  return await todoAccess.todoExists(id);
}
