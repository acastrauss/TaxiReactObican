import { ChangeEvent, FC, useState } from 'react';
import { RegisterData } from '../models/Auth/RegisterData';
import { Input } from '../components/ui/Input';
import { RadioButtonInput } from '../components/ui/RadioButton';
import { UserType } from '../models/Auth/UserType';
import styles from './RegisterPage.module.css';
import { Button } from '../components/ui/Button';
import { EMAIL_REGEX, PASSWORD_REGEX } from '../utils/Regex';
import { AuthServiceType } from '../Services/AuthService';
import { useNavigate } from 'react-router-dom';
import { RoutesNames } from '../Router/Routes';
import { BlobServiceType } from '../Services/BlobService';
import { SHA256 } from 'crypto-js';
import { GoogleAuth } from '../components/auth/GoogleAuth';
import { GoogleAuthService } from '../Services/Google/GoogleAuth';
import { useGoogleOAuth } from '@react-oauth/google';

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

			<Input
				isValid={registerFormValid.Username}
				onChangeText={(val) => {
					setRegisterFormData({ ...registerFormData, Username: val });
					setRegisterFormValid({
						...registerFormValid,
						Username: val.length >= 3,
					});
				}}
				placeholder='Username:'
				textValue={registerFormData.Username}
				type='text'
			/>

			<Input
				isValid={registerFormValid.Email}
				onChangeText={(val) => {
					setRegisterFormData({ ...registerFormData, Email: val });
					setRegisterFormValid({
						...registerFormValid,
						Email: EMAIL_REGEX.test(val),
					});
				}}
				placeholder='Email:'
				textValue={registerFormData.Email}
				type='text'
			/>

			{!usedGoogleAuth && (
				<Input
					isValid={registerFormValid.Password}
					onChangeText={(val) => {
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
					textValue={registerFormData.Password ?? ''}
					type='password'
				/>
			)}

			<Input
				isValid={registerFormValid.FullName}
				onChangeText={(val) => {
					setRegisterFormData({ ...registerFormData, FullName: val });
					setRegisterFormValid({
						...registerFormValid,
						FullName: val.length > 3,
					});
				}}
				placeholder='Full Name:'
				textValue={registerFormData.FullName}
				type='text'
			/>

			<Input
				isValid={registerFormValid.DateOfBirth}
				onChangeText={(val) => {
					setRegisterFormData({
						...registerFormData,
						DateOfBirth: val,
					});
				}}
				placeholder='Date of Birth:'
				textValue={formatDateForInput(registerFormData.DateOfBirth)}
				type='date'
			/>

			<Input
				isValid={registerFormValid.Address}
				onChangeText={(val) => {
					setRegisterFormData({ ...registerFormData, Address: val });
					setRegisterFormValid({
						...registerFormValid,
						Address: val.length > 3,
					});
				}}
				placeholder='Address:'
				textValue={registerFormData.Address}
				type='text'
			/>

			{!usedGoogleAuth && (
				<RadioButtonInput
					selectedValue={UserType[registerFormData.Type]}
					setSelectedValue={(val) => {
						setRegisterFormData({
							...registerFormData,
							Type: UserType[val as keyof typeof UserType],
						});
					}}
					values={[UserType[1], UserType[2]]}
				/>
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

			<a href='Login'>Already have an account? Log In</a>

			<Button text='Register' onClick={onRegister} />
		</div>
	);
};
