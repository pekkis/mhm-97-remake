import { useState } from "react";
import playerTypes from "../data/transfer-market";
import Button from "./form/Button";
import ButtonContainer from "./ui/ButtonContainer";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import Calendar from "./ui/Calendar";
import { currency } from "../services/format";
import ManagerInfo from "./ManagerInfo";
import Box from "./styled-system/Box";
import Tabs from "./ui/Tabs";
import Tab from "./ui/Tab";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { managerBuyPlayer, managerSellPlayer } from "../ducks/manager";
import { activeManager } from "@/data/selectors";

const TransferMarket = () => {
  const manager = useAppSelector(activeManager);
  const dispatch = useAppDispatch();

  const balance = manager.balance;
  const [tab, setTab] = useState(0);

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Pelaajamarkkinat</h2>

        <Calendar
          when={(c) => c.transferMarket}
          fallback={
            <p>
              Valitettavasti siirtoaika on umpeutunut. Tervetuloa takaisin ensi
              vuonna!
            </p>
          }
        >
          <Tabs selected={tab} onSelect={setTab}>
            <Tab title="Osta pelaajia">
              <ButtonContainer>
                {playerTypes.map((playerType, index) => {
                  return (
                    <Button
                      key={index}
                      onClick={() =>
                        dispatch(
                          managerBuyPlayer({
                            manager: manager.id,
                            playerType: index.toString()
                          })
                        )
                      }
                      block
                      disabled={balance < playerType.buy}
                    >
                      <div>{playerType.description}</div>
                      <div>
                        <strong>{currency(playerType.buy)}</strong>
                      </div>
                    </Button>
                  );
                })}
              </ButtonContainer>
            </Tab>
            <Tab title="Myy pelaajia">
              <ButtonContainer>
                {playerTypes.map((playerType, index) => {
                  return (
                    <Button
                      key={index}
                      onClick={() =>
                        dispatch(
                          managerSellPlayer({
                            manager: manager.id,
                            playerType: index.toString()
                          })
                        )
                      }
                      block
                    >
                      <div>{playerType.description}</div>
                      <div>
                        <strong>{currency(playerType.sell)}</strong>
                      </div>
                    </Button>
                  );
                })}
              </ButtonContainer>
            </Tab>
          </Tabs>
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default TransferMarket;
