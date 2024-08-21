import { Link, Outlet, useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { JWTStorageType } from '../Services/JWTStorage';
import { FC, useEffect, useState } from 'react';
import { DriverServiceType } from '../Services/DriverService';
import { DriverStatus } from '../models/Driver';

interface IProps {
	jwtService: JWTStorageType;
	driverService: DriverServiceType;
}

const HomePage: FC<IProps> = (props) => {
	const [userRole, setUserRole] = useState('');
	const [userMail, setUserMail] = useState('');
	const [driverStatus, setDriverStatus] = useState<DriverStatus>();
	const navigate = useNavigate();

	const handleLogout = () => {
		props.jwtService.removeJWT();
		navigate('/login');
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

	return (
		<div className={styles.dashboardContainer}>
			<nav className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<h2>Menu</h2>
				</div>
				<ul className={styles.sidebarMenu}>
					<li>
						<Link className={styles.dashboardLink} to='/profile'>
							Profile
						</Link>
					</li>
					{userRole === 'CLIENT' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/new-ride'
							>
								New ride
							</Link>
						</li>
					)}
					{userRole === 'CLIENT' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/previous-rides-user'
							>
								Previous rides
							</Link>
						</li>
					)}
					{userRole === 'ADMIN' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/verification'
							>
								Verification
							</Link>
						</li>
					)}
					{userRole === 'DRIVER' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/new-rides'
							>
								New rides
							</Link>
						</li>
					)}
					{userRole === 'DRIVER' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/my-rides'
							>
								My rides
							</Link>
						</li>
					)}
					{userRole === 'ADMIN' && (
						<li>
							<Link
								className={styles.dashboardLink}
								to='/all-rides'
							>
								All rides
							</Link>
						</li>
					)}
				</ul>
			</nav>
			<div className={styles.mainContent}>
				<header className={styles.topbar}>
					<h1>Dashboard</h1>
					<div className={styles.userInfo}>
						{userRole === 'DRIVER' && (
							<p>
								{driverStatus === DriverStatus.NOT_VERIFIED
									? 'Driver is not verified'
									: driverStatus === DriverStatus.VERIFIED
									? 'Driver is verified'
									: driverStatus === DriverStatus.BANNED
									? 'Driver is banned'
									: 'Unknown status'}
							</p>
						)}
						<button onClick={handleLogout} type='button'>
							Logout
						</button>
					</div>
				</header>
				<Outlet />
			</div>
		</div>
	);
};

export default HomePage;
