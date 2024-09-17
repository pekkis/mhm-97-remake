import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Loading = () => {
  return (
    <div>
      <FontAwesomeIcon spin icon={["fa", "spinner"]} />
    </div>
  );
};

export default Loading;
