import { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import styles from './Profile.module.css';
import { UserType } from '../models/Auth/UserType';
import { Profile, UpdateUserProfileRequest } from '../models/Auth/Profile';
import { AuthServiceType } from '../Services/AuthService';
import { BlobServiceType } from '../Services/BlobService';
import { SHA256 } from 'crypto-js';

interface IProps {
	authService: AuthServiceType;
	blobService: BlobServiceType;
}

const ProfilePage: FC<IProps> = (props) => {
	const [formData, setFormData] = useState<Profile>({
		username: '',
		email: '',
		password: '',
		fullname: '',
		dateOfBirth: '',
		address: '',
		type: UserType.Admin,
		imagePath: '' as string | File,
	});
	const [originalData, setOriginalData] = useState<Profile>(formData);
	const [localImagePath, setLocalImagePath] = useState<string | File>('');
	const [localImageName, setLocalImageName] = useState<string | undefined>(
		undefined
	);
	const [imageUrl, setImageUrl] = useState('');

	function getLastPartOfUrl(url: string) {
		const parts = url.split('/');
		const lastPart = parts[parts.length - 1];
		return lastPart;
	}

	useEffect(() => {
		const fetchProfile = async () => {
			const data = await props.authService.GetProfile();
			if (data) {
				setFormData({ ...data, password: '' });
				setOriginalData(data);
			}
		};
		fetchProfile();
	}, [props.authService]);

	useEffect(() => {
		const fetchImage = async () => {
			if (typeof formData.imagePath === 'string') {
				const blobName = getLastPartOfUrl(formData.imagePath as string);
				const data = await props.blobService.GetImageUrl(blobName);
				if (data) {
					setImageUrl(data);
				}
			}
		};

		fetchImage();
	}, [props.blobService, formData.imagePath]);

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFormData({
				...formData,
				imagePath: e.target.files[0],
			});
			setLocalImageName(e.target.files[0].name);
			setLocalImagePath(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const updatedData: UpdateUserProfileRequest = {};

		for (const key in formData) {
			if (
				formData[key as keyof Profile] !==
				originalData[key as keyof Profile]
			) {
				if (key !== 'password' || formData.password) {
					(updatedData as any)[key] = formData[key as keyof Profile];
				}
			}
		}

		if (localImagePath instanceof File) {
			const formDataReq = new FormData();
			formDataReq.append('file', localImagePath);
			formDataReq.append('fileName', localImageName!);
			const hashedEmail = SHA256(formData.email).toString();

			const uploadImgRes = await props.blobService.UploadProfileImage(
				formDataReq,
				hashedEmail
			);

			updatedData.imagePath = uploadImgRes;
		}

		try {
			await props.authService.UpdateProfile(updatedData);
			alert('Profile successfully updated!');
		} catch (error) {
			console.error('Failed to update profile:', error);
			alert('Failed to update profile, please try again.');
		}
	};

	function formatDateForInput(dateString: string) {
		console.log(dateString);
		if (!dateString) return getDefaultDate();

		const date = new Date(dateString);

		if (isNaN(date.getTime()) || date.getFullYear() < 1000) {
			return getDefaultDate();
		}

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getDefaultDate() {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	return (
		<form className={styles.form} onSubmit={handleSubmit}>
			<div className={styles.formGroup}>
				<input
					placeholder='Username'
					value={formData.username}
					type='text'
					name='username'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					readOnly={true}
					placeholder='Email'
					value={formData.email}
					type='email'
					name='email'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					placeholder='Password'
					value={formData.password}
					type='password'
					name='password'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					placeholder='Full Name'
					value={formData.fullname}
					type='text'
					name='fullname'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					placeholder='Birth Date'
					value={formatDateForInput(formData.dateOfBirth)}
					type='date'
					name='dateOfBirth'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<input
					placeholder='Address'
					value={formData.address}
					type='text'
					name='address'
					onChange={handleChange}
					className={styles.input}
				/>
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='userType'>Tip korisnika</label>
				<select
					disabled={true}
					id='userType'
					name='type'
					value={formData.type}
					onChange={handleChange}
					className={styles.select}
				>
					<option value={UserType.Admin}>Administrator</option>
					<option value={UserType.Client}>User</option>
					<option value={UserType.Driver}>Driver</option>
				</select>
			</div>
			<div className={styles.formGroup}>
				<label htmlFor='image'>Upload Image</label>
				<input
					type='file'
					id='image'
					name='image'
					accept='image/*'
					onChange={handleImageChange}
					className={styles.input}
				/>
			</div>
			{formData.imagePath && (
				<div className={styles.imagePreview}>
					<img
						width={100}
						src={
							formData.imagePath instanceof File
								? URL.createObjectURL(formData.imagePath)
								: imageUrl
						}
						alt='Preview'
					/>
				</div>
			)}
			<button type='submit' className={styles.submitButton}>
				Submit
			</button>
		</form>
	);
};

export default ProfilePage;
