import { Component, OnInit } from '@angular/core';
import { Client, Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Message } from 'src/app/chat/models/message/message.model';
import { URL_BASE } from 'src/app/config';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

	private client;
	public connected: boolean = false;

	public message: Message = new Message();
	public messages: Message[] = [];

	public writingMessage: string;

	constructor() { }

	ngOnInit(): void {
		this.client = new Client();
		this.client.webSocketFactory = () => {
			return new SockJS(`${URL_BASE}/chat-websocket`);
		}

		this.client.onConnect = (frame) => {
			this.connected = true;

			this.client.subscribe('/chat/message', (e) => {
				let message: Message = JSON.parse(e.body) as Message;
				this.message.date = new Date(message.date);
				if (!this.message.color && message.type === 'NEW_USER' && this.message.username === message.username) this.message.color = message.color;
				this.messages.push(message);
				console.log(this.message);
			});

			this.client.subscribe('/chat/writing', (e) => {
				this.writingMessage = e.body;
				setTimeout(() => this.writingMessage = '', 3000);
			});

			this.message.type = "NEW_USER";
			this.client.publish({
				destination: '/app/message',
				body: JSON.stringify(this.message)
			});
		}

		this.client.onDisconnect = (frame) => {
			this.connected = false;  
		}
	}

	connect(): void {
		this.client.activate();
	}

	disconnect(): void {
		 this.client.deactivate()
	}

	sendMessage(): void {
		delete this.message.date;
		this.message.type = 'MESSAGE';
		this.client.publish({
			destination: '/app/message',
			body: JSON.stringify(this.message)
		});
		this.message.text = '';
	}

	writingEvent() {
		this.client.publish({
			destination: '/app/writing',
			body: this.message.username
		}); 
	}

}
