import { FC, useEffect, useState, useRef } from 'react';
import styles from './NewRidesDriver.module.css';
import { RideServiceType } from '../Services/RideService';
import {
	CreateRideResponse,
	RideStatus,
	UpdateRideRequest,
} from '../models/Ride';
import Modal from '../components/ui/Modal';
import { DriverStatus } from '../models/Driver';
import { DriverServiceType } from '../Services/DriverService';
import { JWTStorageType } from '../Services/JWTStorage';
import Chat from './Chat';

interface IProps {
	rideService: RideServiceType;
	driverService: DriverServiceType;
	jwtService: JWTStorageType;
}

const NewRidesDriver: FC<IProps> = (props) => {
	const [rideData, setRideData] = useState<CreateRideResponse[]>([]);
	const [isModalOpen, setModalOpen] = useState(false);
	const [isRideActive, setIsRideActive] = useState(false);
	const [arrivalTime, setArrivalTime] = useState<number | null>(null);
	const [rideDuration, setRideDuration] = useState<number | null>(null);

	const [driverStatus, setDriverStatus] = useState<DriverStatus>();
	const [userRole, setUserRole] = useState('');
	const [userMail, setUserMail] = useState('');

	const [acceptedRide, setAcceptedRide] = useState<CreateRideResponse|null>(null);

	const arrivalTimeRef = useRef<number | null>(null);
	const rideDurationRef = useRef<number | null>(null);

	const convertToSecondsDifference = (isoTimestamp: number): number => {
		const date = new Date(isoTimestamp);
		const now = new Date();
		const differenceInMilliseconds = date.getTime() - now.getTime();
		return Math.floor(differenceInMilliseconds / 1000);
	};

	useEffect(() => {
		const token = props.jwtService.getJWT();
		if (token !== null) {
			const decoded = props.jwtService.decodeJWT(token.token);
			if (decoded) {
				setUserRole(decoded.role);
				setUserMail(decoded.email);
			}
		}
	}, [props.jwtService]);

	useEffect(() => {
		if (userRole === 'DRIVER') {
			const fetchRides = async () => {
				const data = await props.driverService.GetDriverStatus(
					userMail
				);
				setDriverStatus(data);
			};

			fetchRides();
		}
	}, [props.driverService, userMail, userRole]);

	useEffect(() => {
		const fetchRides = async () => {
			const data = await props.rideService.GetNewRides();
			if (data) {
				setRideData(data);
			}
		};
		fetchRides();
	}, [props.rideService]);

	const handleAcceptRide = async (
		ClientEmail: string,
		RideCreatedAtTimestamp: number
	) => {
		const updateRequest: UpdateRideRequest = {
			ClientEmail,
			RideCreatedAtTimestamp,
			Status: RideStatus.ACCEPTED,
		};

		try {
			const response = await props.rideService.UpdateRideRequests(
				updateRequest
			);
			if (response !== null) {
				const acceptedRideRes = response.data as CreateRideResponse;
				if(acceptedRideRes !== null){
					setAcceptedRide(acceptedRideRes);
				}

				const arrival = convertToSecondsDifference(
					response.data.estimatedDriverArrival
				);
				const duration = convertToSecondsDifference(
					response.data.estimatedRideEnd
				);

				setArrivalTime(arrival);
				setRideDuration(duration);
				arrivalTimeRef.current = arrival;
				rideDurationRef.current = duration;
			}
			const updatedData = await props.rideService.GetNewRides();
			if (updatedData) {
				setRideData(updatedData);
			}
			setIsRideActive(true);
			setModalOpen(true);
		} catch (error) {
			console.error('Failed to accept ride:', error);
			alert('Failed to accept ride.');
		}
	};

	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isRideActive) {
			interval = setInterval(() => {
				if (
					arrivalTimeRef.current !== null &&
					arrivalTimeRef.current > 0
				) {
					arrivalTimeRef.current -= 1;
					setArrivalTime(arrivalTimeRef.current);
				} else if (
					rideDurationRef.current !== null &&
					rideDurationRef.current > 0
				) {
					rideDurationRef.current -= 1;
					setRideDuration(rideDurationRef.current);
				}
			}, 1000);
		}

		return () => {
			clearInterval(interval);
		};
	}, [isRideActive]);

	useEffect(() => {
		if (rideDuration === 0) {
			setIsRideActive(false);
			setModalOpen(false);
		}
	}, [rideDuration]);

	const toggleModal = () => {
		setModalOpen(!isModalOpen);
	};

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes} minutes and ${remainingSeconds} seconds`;
	};

	return (
		<div className={styles.tableContainer}>
			<table className={styles.table}>
				<thead>
					<tr className={styles.row}>
						<th className={styles.headerCell}>Created At</th>
						<th className={styles.headerCell}>Start Address</th>
						<th className={styles.headerCell}>End Address</th>
						<th className={styles.headerCell}>Client Email</th>
						<th className={styles.headerCell}>Driver Email</th>
						<th className={styles.headerCell}>Status</th>
						<th className={styles.headerCell}>Price</th>
						<th className={styles.headerCell}>Accept</th>
					</tr>
				</thead>
				<tbody>
					{rideData.map((ride) => (
						<tr
							className={styles.row}
							key={ride.createdAtTimestamp}
						>
							<td className={styles.dataCell}>
								{ride.createdAtTimestamp}
							</td>
							<td className={styles.dataCell}>
								{ride.startAddress}
							</td>
							<td className={styles.dataCell}>
								{ride.endAddress}
							</td>
							<td className={styles.dataCell}>
								{ride.clientEmail}
							</td>
							<td className={styles.dataCell}>
								{ride.driverEmail ? ride.driverEmail : 'N/A'}
							</td>
							<td className={styles.dataCell}>{ride.status}</td>
							<td className={styles.dataCell}>{ride.price}</td>
							<td className={styles.dataCell}>
								<button
									onClick={() =>
										handleAcceptRide(
											ride.clientEmail,
											ride.createdAtTimestamp
										)
									}
									disabled={
										driverStatus === DriverStatus.BANNED ||
										driverStatus ===
											DriverStatus.NOT_VERIFIED
									}
									type='button'
								>
									Accept
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<Modal
				isOpen={isModalOpen}
				onClose={toggleModal}
				title='My Modal'
				disabled={isRideActive}
			>
				<p>You accepted the ride</p>
				{arrivalTime === null && (
					<p>Estimate time {formatTime(arrivalTime!)}</p>
				)}
				<p>
					Countdown to driver's arrival:{' '}
					{arrivalTime !== null ? formatTime(arrivalTime) : ''}
				</p>
				{rideDuration !== null && (
					<p>Countdown to end of ride: {formatTime(rideDuration)}</p>
				)}
				{ acceptedRide && <Chat ride={acceptedRide} isClient={false}/>}
			</Modal>
		</div>
	);
};

export default NewRidesDriver;
