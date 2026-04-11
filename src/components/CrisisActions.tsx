import { CRISIS_MORALE_MAX } from "../data/constants";
import Button from "./form/Button";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Calendar from "./ui/Calendar";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { managerCrisisMeeting } from "../ducks/manager";

import crisis from "../data/crisis";
import { currency as c } from "../services/format";
import { getEffective } from "../services/effects";

const CrisisActions = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!]
  );
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) => state.game.competitions);
  const dispatch = useAppDispatch();

  const balance = manager.balance;
  const team = getEffective(teams[manager.team!]);

  const crisisInfo = crisis(team, competitions);

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Kriisipalaveri</h2>

        <Calendar
          when={(c) => c.crisisMeeting}
          fallback={
            <p>
              Tässä vaiheessa kautta on auttamatta liian myöhäistä
              kriisipalaveroida!
            </p>
          }
        >
          <p>
            Kriisipalaveri auttaa joukkuetta unohtamaan tappioputken ja
            keskittymään tulevaan. Se maksaa {c(crisisInfo.amount)}.
          </p>

          <Button
            block
            disabled={
              balance < crisisInfo.amount || team.morale > CRISIS_MORALE_MAX
            }
            onClick={() =>
              dispatch(managerCrisisMeeting({ manager: manager.id }))
            }
          >
            Pidä kriisipalaveri
          </Button>
        </Calendar>
      </Box>
    </HeaderedPage>
  );
};

export default CrisisActions;
