import ButtonRow from "./form/ButtonRow";
import Button from "./form/Button";
import Box from "./styled-system/Box";
import ManagerForm from "./start-menu/ManagerForm";
import styled from "styled-components";
import title from "./start-menu/title.png";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { startGame, loadGame } from "../ducks/meta";
import { advance } from "../ducks/game";
import { pick } from "remeda";

const Menu = styled.div``;

const Contents = styled.div`
  h1 {
    margin: 0;
  }

  h2 {
    margin: 0;
    font-size: 1em;
  }
`;

const TitleImg = styled.img`
  max-width: 100%;
  display: block;
`;

const Centerer = styled.div`
  text-align: center;
`;

const StartMenuInner = ({ className }: { className?: string }) => {
  const teams = useAppSelector((state) => state.game.teams);
  const competitions = useAppSelector((state) =>
    pick(state.game.competitions, ["phl", "division"]),
  );
  const manager = useAppSelector((state) => state.meta.manager);
  const starting = useAppSelector((state) => state.meta.starting);
  const dispatch = useAppDispatch();

  return (
    <div className={className}>
      <Menu>
        <Contents>
          <Centerer>
            <TitleImg src={title} />
            <Box px={1} py={0}>
              <h1>MHM 97</h1>
              <h2>maailman paras jääkiekkomanagerisimulaatio</h2>
              <h2>build: rpoot</h2>
            </Box>
          </Centerer>

          {!starting && (
            <Box p={1}>
              <Centerer>
                <ButtonRow>
                  <Button onClick={() => dispatch(startGame())}>
                    Uusi peli
                  </Button>
                  <Button onClick={() => dispatch(loadGame())}>
                    Lataa peli
                  </Button>
                </ButtonRow>
              </Centerer>
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
                manager={manager}
                advance={(payload: any) => dispatch(advance(payload))}
              />
            </Box>
          )}
        </Contents>
      </Menu>
    </div>
  );
};

export default styled(StartMenuInner)`
  margin: 0 auto;
  max-width: 600px;

  p {
    margin: 1em 0;
  }
`;
