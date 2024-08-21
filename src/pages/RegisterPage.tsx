import { ChangeEvent, FC, useState } from 'react';
import { RegisterData } from '../models/Auth/RegisterData';
import { UserType } from '../models/Auth/UserType';
import styles from './RegisterPage.module.css';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../utils/Regex';
import { AuthServiceType } from '../Services/AuthService';
import { Link, useNavigate } from 'react-router-dom';
import { RoutesNames } from '../Router/Routes';
import { BlobServiceType } from '../Services/BlobService';
import { SHA256 } from 'crypto-js';
import { GoogleAuth } from '../components/auth/GoogleAuth';
import { GoogleAuthService } from '../Services/Google/GoogleAuth';

interface IProps {
	authService: AuthServiceType;
	blobService: BlobServiceType;
}

export const RegisterPage: FC<IProps> = (props) => {
	const navigate = useNavigate();

	const [registerFormData, setRegisterFormData] = useState({
		Username: '',
		Email: '',
		Password: '',
		FullName: '',
		Address: '',
		DateOfBirth: new Date().toUTCString(),
		Type: UserType.Client,
	} as RegisterData);

	const [localImagePath, setLocalImagePath] = useState<string | File>('');
	const [localImageName, setLocalImageName] = useState<string | undefined>(
		undefined
	);
	const [usedGoogleAuth, setUsedGoogleAuth] = useState(false);

	const [registerFormValid, setRegisterFormValid] = useState({
		Username: true,
		Email: true,
		Password: true,
		FullName: true,
		DateOfBirth: true,
		Address: true,
		Type: true,
		ImagePath: true,
	});

	const isValid = () => {
		return (
			registerFormValid.Username &&
			registerFormValid.Email &&
			registerFormValid.Password &&
			registerFormValid.FullName &&
			registerFormValid.DateOfBirth &&
			registerFormValid.Address &&
			registerFormValid.Type &&
			registerFormValid.ImagePath
		);
	};

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setLocalImageName(e.target.files[0].name);
			setLocalImagePath(e.target.files[0]);
			console.log(e.target.files[0]);
		}
	};

	console.log(localImagePath);
	console.log(typeof localImagePath);

	async function onRegister() {
		if (!isValid() || !localImagePath || !localImageName) {
			alert('Please fill out the form');
			return;
		}

		let file;

		if (usedGoogleAuth) {
			const localImagePathString =
				typeof localImagePath === 'string' ? localImagePath : '';
			if (localImagePathString) {
				const fetchedImg = await fetch(localImagePathString);
				const blobImg = await fetchedImg.blob();
				file = new File([blobImg], localImageName);
			}
		} else {
			file = localImagePath instanceof File ? localImagePath : null;
		}

		if (!file) {
			alert('Failed to process the image.');
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		formData.append('fileName', localImageName);
		const hashedEmail = SHA256(registerFormData.Email).toString();

		console.log(formData);
		console.log(file);
		console.log(localImageName);
		console.log(hashedEmail);
		const uploadImgRes = await props.blobService.UploadProfileImage(
			formData,
			hashedEmail
		);

		if (!uploadImgRes) {
			alert('Failed uploading image.');
			return;
		}

		let registerDataSend = { ...registerFormData };

		if (usedGoogleAuth) {
			registerDataSend.Password = undefined;
			registerDataSend.ImagePath = uploadImgRes;
		} else {
			registerDataSend.ImagePath = uploadImgRes;
		}

		const res = await props.authService.Register(registerDataSend);

		if (!res) {
			alert('Registration failed, please try different parameters.');
			return;
		}

		alert('Registration successful, please log in.');
		navigate(`../${RoutesNames.Login}`);
	}

	function getFirstPartOfEmail(email: string) {
		if (!email || typeof email !== 'string') {
			throw new Error('Invalid email input');
		}
		const firstPart = email.split('@')[0];
		return firstPart;
	}

	function formatDateForInput(dateString: string) {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	console.log(registerFormData.DateOfBirth);

	return (
		<div className={styles.form}>
			<input
				type='file'
				id='image'
				name='image'
				accept='image/*'
				onChange={handleImageChange}
				className={styles.input}
			/>

			{localImagePath && (
				<div className={styles.imagePreview}>
					<img
						width={100}
						src={
							localImagePath instanceof File
								? URL.createObjectURL(localImagePath)
								: localImagePath
						}
						alt='Preview'
					/>
				</div>
			)}

			<input
				className={`${styles.input} ${
					registerFormValid.Username ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setRegisterFormData({ ...registerFormData, Username: val });
					setRegisterFormValid({
						...registerFormValid,
						Username: val.length >= 3,
					});
				}}
				placeholder='Username:'
				value={registerFormData.Username}
				type='text'
			/>

			<input
				className={`${styles.input} ${
					registerFormValid.Email ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setRegisterFormData({ ...registerFormData, Email: val });
					setRegisterFormValid({
						...registerFormValid,
						Email: EMAIL_REGEX.test(val),
					});
				}}
				placeholder='Email:'
				value={registerFormData.Email}
				type='text'
			/>

			{!usedGoogleAuth && (
				<input
					className={`${styles.input} ${
						registerFormValid.Password ? '' : styles.invalid
					}`}
					onChange={(e) => {
						const val = e.target.value;
						setRegisterFormData({
							...registerFormData,
							Password: val,
						});
						setRegisterFormValid({
							...registerFormValid,
							Password: PASSWORD_REGEX.test(val),
						});
					}}
					placeholder='Password:'
					value={registerFormData.Password ?? ''}
					type='password'
				/>
			)}

			<input
				className={`${styles.input} ${
					registerFormValid.FullName ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setRegisterFormData({ ...registerFormData, FullName: val });
					setRegisterFormValid({
						...registerFormValid,
						FullName: val.length > 3,
					});
				}}
				placeholder='Full Name:'
				value={registerFormData.FullName}
				type='text'
			/>

			<input
				className={`${styles.input} ${
					registerFormValid.DateOfBirth ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setRegisterFormData({
						...registerFormData,
						DateOfBirth: val,
					});
				}}
				placeholder='Date of Birth:'
				value={formatDateForInput(registerFormData.DateOfBirth)}
				type='date'
			/>

			<input
				className={`${styles.input} ${
					registerFormValid.Address ? '' : styles.invalid
				}`}
				onChange={(e) => {
					const val = e.target.value;
					setRegisterFormData({ ...registerFormData, Address: val });
					setRegisterFormValid({
						...registerFormValid,
						Address: val.length > 3,
					});
				}}
				placeholder='Address:'
				value={registerFormData.Address}
				type='text'
			/>

			{!usedGoogleAuth && (
				<div className={styles.radioGroup}>
					<label>
						<input
							type='radio'
							name='userType'
							value={UserType.Client}
							checked={registerFormData.Type === UserType.Client}
							onChange={() =>
								setRegisterFormData({
									...registerFormData,
									Type: UserType.Client,
								})
							}
							className={styles.radioButton}
						/>
						Client
					</label>
					<label>
						<input
							type='radio'
							name='userType'
							value={UserType.Driver}
							checked={registerFormData.Type === UserType.Driver}
							onChange={() =>
								setRegisterFormData({
									...registerFormData,
									Type: UserType.Driver,
								})
							}
							className={styles.radioButton}
						/>
						Driver
					</label>
				</div>
			)}

			<div>
				<GoogleAuth
					googleAuthService={GoogleAuthService}
					setUserInfo={(userInfo) => {
						console.log(userInfo);
						setRegisterFormData({
							...registerFormData,
							Password: undefined,
							Email: userInfo.email,
							FullName: userInfo.name,
							Username: getFirstPartOfEmail(userInfo.email),
							DateOfBirth: new Date().toISOString(),
							Address: 'Random Address',
							Type: UserType.Client,
						});
						setRegisterFormValid({
							Address: true,
							DateOfBirth: true,
							Email: EMAIL_REGEX.test(userInfo.email),
							FullName: userInfo.name.length > 3,
							ImagePath: true,
							Password: true,
							Username: true,
							Type: true,
						});
						setLocalImagePath(userInfo.picture);
						setLocalImageName('image.png');
						setUsedGoogleAuth(true);
					}}
				/>
			</div>
			<Link to='/Login' className={styles.link}>
				Already have an account? Log In
			</Link>
			<button className={styles.button} onClick={onRegister}>
				Register
			</button>
		</div>
	);
};
