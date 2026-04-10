import { Link } from "react-router-dom";
import Calendar from "./ui/Calendar";
import { getEffective } from "../services/effects";
import { CRISIS_MORALE_MAX } from "../data/constants";
import Button from "./form/Button";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { closeMenu } from "../ducks/ui";
import { saveGame, quitToMainMenu } from "../ducks/meta";

const ActionMenu = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const teams = useAppSelector((state) => state.game.teams);
  const turn = useAppSelector((state) => state.game.turn);
  const dispatch = useAppDispatch();
  const team = getEffective(teams[manager.team!]);

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link onClick={() => dispatch(closeMenu())} to="/">
              Päävalikko
            </Link>
          </li>

          {team.morale <= CRISIS_MORALE_MAX && (
            <Calendar when={(c) => c.crisisMeeting}>
              <li>
                <Link
                  onClick={() => dispatch(closeMenu())}
                  to="/kriisipalaveri"
                >
                  Kriisipalaveri
                </Link>
              </li>
            </Calendar>
          )}
          <Calendar when={(c) => c.transferMarket}>
            <li>
              <Link
                onClick={() => dispatch(closeMenu())}
                to="/pelaajamarkkinat"
              >
                Pelaajamarkkinat
              </Link>
            </li>
          </Calendar>
          <li>
            <Link onClick={() => dispatch(closeMenu())} to="/sarjataulukot">
              Sarjataulukot
            </Link>
          </li>

          <li>
            <Link onClick={() => dispatch(closeMenu())} to="/areena">
              Areena
            </Link>
          </li>

          <li>
            <Link
              onClick={() => dispatch(closeMenu())}
              to="/erikoistoimenpiteet"
            >
              Erikoistoimenpiteet
            </Link>
          </li>

          <Calendar when={(c) => c.pranks}>
            <li>
              <Link onClick={() => dispatch(closeMenu())} to="/jaynat">
                Jäynät
              </Link>
            </li>
          </Calendar>

          <li>
            <Link onClick={() => dispatch(closeMenu())} to="/tilastot">
              Tilastot
            </Link>
          </li>

          <Calendar
            when={(e, c, s) => {
              return (
                e.gamedays.includes("phl") &&
                s.game.competitions.phl.phase === 0
              );
            }}
          >
            <li>
              <Link onClick={() => dispatch(closeMenu())} to="/veikkaus">
                Veikkaus
              </Link>
            </li>
          </Calendar>

          <li>
            <Link onClick={() => dispatch(closeMenu())} to="/debug">
              Devausmenukka
            </Link>
          </li>
        </ul>
      </nav>
      <Button
        block
        disabled={turn.phase !== "action"}
        type="button"
        onClick={() => {
          dispatch(saveGame());
          dispatch(closeMenu());
        }}
      >
        Tallenna
      </Button>

      <Button
        block
        type="button"
        onClick={() => {
          dispatch(quitToMainMenu());
          dispatch(closeMenu());
        }}
      >
        Lopeta!
      </Button>
    </div>
  );
};

export default ActionMenu;
