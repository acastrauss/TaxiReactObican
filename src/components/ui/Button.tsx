import { FC } from 'react';
import styles from './Button.module.css';

interface IProps {
	text: string;
	onClick?: () => void;
	className?: string;
}

export const Button: FC<IProps> = (props) => {
	return (
		<button onClick={props.onClick} className={`${styles.button} ${props.className ?? ''}`}>
			{props.text}
		</button>
	);
};
