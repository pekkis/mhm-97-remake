import { FC } from "react";

type Props = {
  long: boolean;
  index: number;
};

const Season: FC<Props> = ({ index, long = false }) => {
  if (!long) {
    return index + 1998;
  }

  return `${index + 1997}-${index + 1998}`;
};

export default Season;
