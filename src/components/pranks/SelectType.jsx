import React from "react";
import Button from "../form/Button";
import ButtonContainer from "../ui/ButtonContainer";
import pranks from "../../data/pranks";
import { currency as c } from "../../services/format";

const SelectType = (props) => {
  const { manager, selectType, competition, enabled } = props;
  return (
    <div>
      <ButtonContainer>
        {Object.entries(pranks).map(([key, prank]) => {
          const price = prank.price(competition);

          return (
            <Button
              disabled={!enabled || price > manager.get("balance")}
              block
              key={key}
              onClick={() => {
                selectType(key);
              }}
            >
              <div>{prank.name}</div>
              <div>
                <small>{c(price)}</small>
              </div>
            </Button>
          );
        })}
      </ButtonContainer>
    </div>
  );
};

export default SelectType;
