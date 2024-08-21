import React, { FC, useEffect, useState } from 'react';
import styles from './Chat.module.css';
import Message from '../components/ui/Message';
import { AuthServiceType } from '../Services/AuthService';
import { UserType } from '../models/Auth/UserType';
import { Profile } from '../models/Auth/Profile';
import * as signalR from '@microsoft/signalr';
import { JWTStorage } from '../Services/JWTStorage';
import { CreateRideResponse } from '../models/Ride';

interface ChatMessage {
	userEmail: string;
	content: string;
	timestamp: Date;
	clientEmail: string;
	driverEmail: string;
	rideCreadtedAtTimestamp: number;
}

interface Chat {
	clientEmail: string;
	driverEmail: string;
	rideCreatedAtTimestamp: number;
	messages: ChatMessage[];
	status: number;
}

interface IProps {
	ride: CreateRideResponse;
	isClient: boolean;
}

const Chat: FC<IProps> = (props) => {
	const [chat, setChat] = useState<Chat | null>(null);
	const [connection, setConnection] = useState<signalR.HubConnection | null>(
		null
	);
	const [message, setMessage] = useState('');

	useEffect(() => {
		const newConnection = new signalR.HubConnectionBuilder()
			.withUrl(`http://localhost:9068/chathub`, {
				accessTokenFactory: () => JWTStorage.getJWT()!.token,
			})
			.withAutomaticReconnect()
			.build();

		setConnection(newConnection);

		if (newConnection) {
		}
	}, []);

	const receivedMessageCallback = (userEmail: string, newChat: Chat) => {
		console.log(newChat);
		setChat(newChat);
	};

	useEffect(() => {
		if (
			connection &&
			connection.state !== signalR.HubConnectionState.Connected
		) {
			connection
				.start()
				.then(() => {
					console.log('aaaaaaaaaaaaaa');
					connection.on('ReceiveMessage', receivedMessageCallback);
					connection.on(
						'CreateOrGetChat',
						(userEmail: string, chat: Chat) => {
							setChat(chat);
						}
					);
					try {
						connection.invoke('CreateNewOrGetExistingChat', {
							clientEmail: props.ride.clientEmail,
							driverEmail: props.ride.driverEmail,
							messages: [] as any,
							rideCreatedAtTimestamp:
								props.ride.createdAtTimestamp,
							status: 0,
						} as Chat);
					} catch (error) {
						console.error(error);
					}
				})
				.catch((err) => console.log('Connection failed: ', err));
		}
	}, [connection]);

	const sendMessage = async () => {
		if (connection && message) {
			try {
				await connection.invoke('SendMessage', {
					clientEmail: props.ride.clientEmail,
					driverEmail: props.ride.driverEmail,
					rideCreadtedAtTimestamp: props.ride.createdAtTimestamp,
					content: message,
					timestamp: new Date(),
					userEmail: props.isClient
						? props.ride.clientEmail
						: props.ride.driverEmail,
				} as ChatMessage);
				setMessage('');
			} catch (err) {
				console.error(err);
			}
		}
	};

	return (
		<div>
			<input
				type='text'
				placeholder='Message'
				value={message}
				onChange={(e) => setMessage(e.target.value)}
			/>
			<button onClick={sendMessage}>Send</button>
			<ul>
				{chat && chat.messages &&
					chat.messages
						.sort(
							(msg1, msg2) =>
								new Date(msg1.timestamp).getTime() -
								new Date(msg2.timestamp).getTime()
						)
						.map((msg, index) => (
							<li key={index}>
								<strong>{msg.userEmail}:</strong> {msg.content}
							</li>
						))}
			</ul>
		</div>
	);
};

export default Chat;
