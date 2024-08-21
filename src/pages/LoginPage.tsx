import { FC, useEffect, useState } from 'react';
import { AuthType, LoginData } from '../models/Auth/LoginData';
import styles from './LoginPage.module.css';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../utils/Regex';
import { AuthServiceType } from '../Services/AuthService';
import { JWT } from '../models/Auth/JWT';
import { JWTStorageType } from '../Services/JWTStorage';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuth } from '../components/auth/GoogleAuth';
import { GoogleAuthService } from '../Services/Google/GoogleAuth';

interface IProps {
	authService: AuthServiceType;
	jwtStorage: JWTStorageType;
}

export const LoginPage: FC<IProps> = (props) => {
	const navigate = useNavigate();

	const [loginFormData, setLoginFormData] = useState({
		Email: '',
		Password: '',
		authType: AuthType.TRADITIONAL,
	} as LoginData);

	const [loginFormValid, setLoginFormValid] = useState({
		Email: true,
		Password: true,
	});

	const [usedGoogleAuth, setUsedGoogleAuth] = useState(false);

	const isValid = () => {
		return loginFormValid.Email && loginFormValid.Password;
	};

	async function onLogin() {
		if (!isValid()) {
			alert('Please fill out the form');
			return;
		}

		console.log(loginFormData);

		const res = await props.authService.Login(loginFormData);

		if (!res) {
			alert('Invalid credentials.');
			return;
		}

		const jwt = res.data as JWT;
		props.jwtStorage.setJWT(jwt);
		navigate(`../`);
	}

	useEffect(() => {
		const isFormValid = loginFormValid.Email && loginFormData.Email;

		if (isFormValid && usedGoogleAuth) {
			onLogin();
		}
	}, [loginFormData, loginFormValid]);

	return (
		<div className={styles.form}>
			<input
				className={`${styles.input} ${
					loginFormValid.Email ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setLoginFormData({ ...loginFormData, Email: val });
					setLoginFormValid({
						...loginFormValid,
						Email: EMAIL_REGEX.test(val),
					});
				}}
				placeholder='Email:'
				value={loginFormData.Email}
				type='text'
			/>

			{loginFormData.authType === AuthType.TRADITIONAL && (
				<input
					className={`${styles.input} ${
						loginFormValid.Password ? '' : styles.invalid
					}`}
					onChange={(e) => {
						const val = e.target.value;
						setLoginFormData({ ...loginFormData, Password: val });
						setLoginFormValid({
							...loginFormValid,
							Password: PASSWORD_REGEX.test(val),
						});
					}}
					placeholder='Password:'
					value={loginFormData.Password ?? ''}
					type='password'
				/>
			)}

			<div>
				<GoogleAuth
					googleAuthService={GoogleAuthService}
					setUserInfo={(userInfo) => {
						setLoginFormData({
							Password: undefined,
							Email: userInfo.email,
							authType: AuthType.GOOGLE,
						});
						setLoginFormValid({
							...loginFormValid,
							Email: EMAIL_REGEX.test(userInfo.email),
						});
						setUsedGoogleAuth(true);
					}}
				/>
			</div>
			<Link to='/register' className={styles.link}>
				Don't have an account? Register here!
			</Link>
			<button className={styles.button} onClick={onLogin}>
				Login
			</button>
		</div>
	);
};
