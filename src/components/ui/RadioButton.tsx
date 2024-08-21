import { FC } from "react";
import styles from "./RadioButton.module.css";

interface IProps {
  values: string[];

  selectedValue: string;
  setSelectedValue: (val: string) => void;
}

export const RadioButtonInput: FC<IProps> = (props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.setSelectedValue(event.target.value);
  };

  return (
    <div className={styles.root}>
      {props.values.map((val, indx) => {
        return (
          <label key={indx} className={styles.radioButtonLabel}>
            <input
              className={styles.radioButton}
              type="radio"
              value={val}
              checked={props.selectedValue === val}
              onChange={handleChange}
            />
            {val}
          </label>
        );
      })}
    </div>
  );
};
