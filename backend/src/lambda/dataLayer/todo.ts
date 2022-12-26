import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { TodoItem, UpdateTodoRequest } from '../types/Todo'
import { createLogger } from '../helpers/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const logger = createLogger('TodoAccess')

const XAWS = AWSXRay.captureAWS(AWS);

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly attachmentBucket = process.env.ATTACHMENT_S3_BUCKET) {
  }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {

    const result = await this.docClient.query({
      TableName: this.todoTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      
    }).promise()
    const items = result.Items

    return items as TodoItem[]
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    const result = await this.docClient.get({
        TableName: this.todoTable,
        Key: {
            todoId,
            userId
        }
    }).promise();

    return result.Item as TodoItem;
}

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise()

    return todo;
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.todoTable,
      Key: {
        todoId,
        userId
      }
    }).promise();

    return;
  }

  async updateTodo(userId: string, todoId: string, todo: UpdateTodoRequest): Promise<void> {
    logger.info('Starting update todo: ', todo);
    await this.docClient.update({
      TableName: this.todoTable,
      Key: { todoId, userId },
      UpdateExpression: 'set #name = :updateName, #done = :doneStatus, #dueDate = :updateDueDate',
      ExpressionAttributeNames: { '#name': 'name', '#done': 'done', '#dueDate': 'dueDate' },
      ExpressionAttributeValues: {
        ':updateName': todo.name,
        ':doneStatus': todo.done,
        ':updateDueDate': todo.dueDate,
      },
      ReturnValues: "UPDATED_NEW"
    }).promise();

    return;
  }
  
  async updateTodoAttachment(userId: string, todoId: string, s3Key: string): Promise<void> {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: { todoId, userId },
      UpdateExpression: 'set #attachmentUrl = :attachmentUrl',
      ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${this.attachmentBucket}.s3.amazonaws.com/${s3Key}`
      },
      ReturnValues: "UPDATED_NEW"
    }).promise();
  }

  async removeTodoAttachment(userId: string, todoId: string): Promise<void> {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: { todoId, userId },
      UpdateExpression: 'set #attachmentUrl = :attachmentUrl',
      ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
      ExpressionAttributeValues: {
        ':attachmentUrl': ''
      },
      ReturnValues: "UPDATED_NEW"
    }).promise();
  }

  async todoExists(todoId: string): Promise<boolean> {
    const result = await this.docClient
      .get({
        TableName: this.todoTable,
        Key: {
          todoId
        }
      })
      .promise()
  
    return !!result.Item
  }
}

