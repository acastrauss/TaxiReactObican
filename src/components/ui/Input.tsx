import React, { FC, HTMLInputTypeAttribute } from 'react';
import styles from './Input.module.css';

interface IProps {
	textValue: string;
	onChangeText: (val: string) => void;
	type: HTMLInputTypeAttribute;
	placeholder: string;
	isValid: boolean;
}

export const Input: FC<IProps> = (props) => {
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.onChangeText(e.target.value);
	};

	const isDate = props.type === 'date' ? styles.date__padding : '';

	return (
		<div className={styles.input__container}>
			<label className={styles.label}>{props.placeholder}</label>
			<input
				type={props.type}
				onChange={handleInputChange}
				value={props.textValue}
				className={
					props.isValid
						? `${styles.input} ${isDate}`
						: `${styles.input} ${styles.invalid} ${isDate}`
				}
			/>
		</div>
	);
};
