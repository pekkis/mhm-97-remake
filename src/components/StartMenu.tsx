import ButtonRow from "./form/ButtonRow";
import Button from "./form/Button";
import Box from "./styled-system/Box";
import ManagerForm from "./start-menu/ManagerForm";
import * as styles from "./StartMenu.css";
import title from "./start-menu/title.png";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { startGame, loadGame } from "@/ducks/meta";
import { advance } from "@/ducks/game";
import { primaryCompetitions } from "@/selectors";
import { useSelector } from "@xstate/react";
import { appActor } from "@/machines/app";

const StartMenu = () => {
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector(primaryCompetitions);

  const starting = useSelector(appActor, (state) => state.matches("starting"));
  const dispatch = useAppDispatch();

  return (
    <div className={styles.startMenu}>
      <div>
        <div className={styles.contents}>
          <div className={styles.centerer}>
            <img className={styles.titleImg} src={title} />
            <Box px={1} py={0}>
              <h1>MHM 97</h1>
              <h2>maailman paras jääkiekkomanagerisimulaatio</h2>
              <h2>build: rpoot</h2>
            </Box>
          </div>

          {!starting && (
            <Box p={1}>
              <div className={styles.centerer}>
                <ButtonRow>
                  <Button onClick={() => dispatch(startGame())}>
                    Uusi peli
                  </Button>
                  <Button onClick={() => dispatch(loadGame())}>
                    Lataa peli
                  </Button>
                </ButtonRow>
              </div>
              <h3>Alkuperäinen suunnittelu & ohjelmointi</h3>
              <ul>
                <li>Mikko Forsström</li>
              </ul>
              <h3>Remaken suunnittelu & ohjelmointi</h3>
              <ul>
                <li>Mikko Forsström</li>
              </ul>
              <h3>Grafiikka</h3>
              <ul>
                <li>Teemu Nevalainen</li>
                <li>Mikko Forsström</li>
              </ul>
              <h3>Laadunvalvonta</h3>
              <ul>
                <li>Teemu Nevalainen</li>
                <li>Sami Helen</li>
                <li>A-P Nevalainen</li>
                <li>Antti Kettunen</li>
              </ul>
              <h3>v1.2 betatestaus</h3>
              <ul>
                <li>Henri Hokkanen</li>
                <li>Jussi Kniivilä </li>
                <li>Tony Herranen</li>
                <li>Antti Laakso</li>
                <li>Markus Lämsä</li>
                <li>Tomi Salmi</li>
                <li>Aleksi Ursin</li>
                <li>Ilmari Sandelin</li>
              </ul>
              <h3>Erityiskiitokset</h3>
              <ul>
                <li>Erno Vanhala</li>
                <li>Sami Ritola</li>
              </ul>
            </Box>
          )}

          {starting && (
            <Box p={1}>
              <ManagerForm
                teams={teams}
                competitions={competitions}
                advance={(payload: any) => dispatch(advance(payload))}
              />
            </Box>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
