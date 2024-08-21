import React, { useState } from 'react';
import styles from './Rating.module.css';

interface RatingProps {
	onRate?: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({ onRate }) => {
	const [rating, setRating] = useState<number>(0);
	const [hover, setHover] = useState<number>(0);

	return (
		<div className={styles.rating}>
			{[...Array(5)].map((_, index) => {
				const starRating = index + 1;

				return (
					<button
						type='button'
						key={index}
						className={`${styles.star} ${
							starRating <= (hover || rating) ? styles.filled : ''
						}`}
						onClick={() => {
							setRating(starRating);
							if (onRate) onRate(starRating);
						}}
						onMouseEnter={() => setHover(starRating)}
						onMouseLeave={() => setHover(0)}
					>
						&#9733;
					</button>
				);
			})}
		</div>
	);
};

export default Rating;
