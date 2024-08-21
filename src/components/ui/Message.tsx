import React from 'react';
import styles from './Message.module.css';

interface MessageProps {
	sender: string;
	content: string;
	timestamp: string;
	isOwnMessage: boolean;
}

const Message: React.FC<MessageProps> = ({
	sender,
	content,
	timestamp,
	isOwnMessage,
}) => {
	return (
		<div
			className={`${styles.messageContainer} ${
				isOwnMessage ? styles.ownMessage : styles.otherMessage
			}`}
		>
			<div className={styles.sender}>{sender}</div>
			<div className={styles.content}>{content}</div>
			<div className={styles.timestamp}>{timestamp}</div>
		</div>
	);
};

export default Message;
