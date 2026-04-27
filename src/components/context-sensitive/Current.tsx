import { Link } from "react-router-dom";
import Calendar from "@/components/ui/Calendar";
import * as styles from "./Current.css";
import { FaExclamationCircle } from "react-icons/fa";
import { useGameContext } from "@/context/game-machine-context";
import {
  activeManagersInvitations,
  activeManagersTeam
} from "@/machines/selectors";

const Current = () => {
  const invitations = useGameContext(activeManagersInvitations);
  const team = useGameContext(activeManagersTeam);

  return (
    <div className={styles.current}>
      {invitations.filter((i) => !i.accepted).length > 0 && (
        <div className={styles.currentEntry}>
          <FaExclamationCircle />
          Pöydälläsi odottaa{" "}
          <Link to="/kutsut">avaamattomia kutsuja joulutauon turnauksiin.</Link>
        </div>
      )}

      <Calendar
        when={(entry, c) => {
          const nextTurn = c[entry.round + 1];
          return entry.transferMarket && !nextTurn.transferMarket;
        }}
      >
        <div className={styles.currentEntry}>
          <FaExclamationCircle /> Nyt on viimeinen tilaisuutemme{" "}
          <Link to="/pelaajamarkkinat">ostaa pelaajia</Link>, sillä siirtoaika
          umpeutuu seuraavan ottelun jälkeen.
        </div>
      </Calendar>

      <Calendar when={(e) => e.crisisMeeting && team.morale <= -3}>
        <div className={styles.currentEntry}>
          <FaExclamationCircle /> Joukkueen moraali on huono.{" "}
          <Link to="/kriisipalaveri">Kriisipalaveri</Link> auttaisi.
        </div>
      </Calendar>
    </div>
  );
};

export default Current;
