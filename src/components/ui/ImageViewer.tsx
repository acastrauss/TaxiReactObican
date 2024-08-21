import { useEffect, useMemo, useRef, useState } from 'react';
import { FCC } from '../../utils/FCC';
import styles from './ImageViewer.module.css';
import { IconPlus } from '@tabler/icons-react';

interface IProps {
	imageUrl?: string | File;
	alt: string;

	setImageUrl: (url: any) => void;
	setLocalName: (name: string) => void;
}

export const ImageViewer: FCC<IProps> = (props) => {
	const imagePickerRef = useRef<null | HTMLInputElement>(null);
	const [localImageUrl, setLocalImageUrl] = useState<any>(undefined);

	function onImageUploaded(event: React.ChangeEvent<HTMLInputElement>) {
		if (!event.target.files) {
			return;
		}
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setLocalImageUrl(reader.result);
				props.setImageUrl(file);
				props.setLocalName(file.name);
			};
			reader.readAsDataURL(file);
		}
	}

	useEffect(() => {
		async function fetchRemoteImage() {
			if (props.imageUrl) {
				const fetchedImg = await fetch(props.imageUrl as string);
				const blob = await fetchedImg.blob();
				const reader = new FileReader();
				reader.onloadend = () => {
					setLocalImageUrl(reader.result);
				};
				reader.readAsDataURL(blob);
			}
		}

		fetchRemoteImage();
	}, [props.imageUrl]);

	const imageContent = useMemo(() => {
		if (props.imageUrl) {
			return (
				<div className={styles.imagePreview}>
					<img
						width={100}
						src={
							props.imageUrl instanceof File
								? URL.createObjectURL(props.imageUrl)
								: props.imageUrl
						}
						alt='Preview'
					/>
				</div>
			);
		}

		return (
			<>
				<input
					style={{ display: 'none' }}
					type='file'
					multiple={false}
					accept='image/jpeg, image/png'
					ref={imagePickerRef}
					onChange={onImageUploaded}
				/>
				<div className={styles.uploadIcon}>
					<IconPlus
						size={44}
						onClick={(ev) => {
							ev.preventDefault();
							if (imagePickerRef.current) {
								imagePickerRef.current.click();
							}
						}}
					/>
				</div>
			</>
		);
	}, [localImageUrl, imagePickerRef, props.imageUrl]);

	return <div className={styles.root}>{imageContent}</div>;
};
