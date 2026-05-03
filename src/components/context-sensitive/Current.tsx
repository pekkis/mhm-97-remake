import { Link } from "react-router-dom";
import calendar from "@/data/calendar";
import { useGameContext } from "@/context/game-machine-context";
import {
  activeManager,
  activeManagersInvitations,
  canCrisisMeeting
} from "@/machines/selectors";
import Stack from "@/components/ui/Stack";
import Alert from "@/components/ui/Alert";

const Current = () => {
  const invitations = useGameContext(activeManagersInvitations);
  const manager = useGameContext(activeManager);
  const round = useGameContext((ctx) => ctx.turn.round);
  const showCrisis = useGameContext(canCrisisMeeting(manager.id));

  const entry = calendar[round];
  const nextTurn = calendar[round + 1];

  const numberOfAcceptedInvititations = invitations.filter(
    (i) => !i.accepted
  ).length;

  const showInvitations = numberOfAcceptedInvititations > 0;
  const showTransferDeadline =
    !!entry?.transferMarket && !!nextTurn && !nextTurn.transferMarket;

  if (!showInvitations && !showTransferDeadline && !showCrisis) {
    return null;
  }

  return (
    <Stack gap="sm">
      {showInvitations && (
        <Alert level="info">
          Pöydälläsi odottaa{" "}
          <Link to="/kutsut">avaamattomia kutsuja joulutauon turnauksiin.</Link>
        </Alert>
      )}

      {showTransferDeadline && (
        <Alert level="warning">
          Nyt on viimeinen tilaisuutemme{" "}
          <Link to="/pelaajamarkkinat">ostaa pelaajia</Link>, sillä siirtoaika
          umpeutuu seuraavan ottelun jälkeen.
        </Alert>
      )}

      {showCrisis && (
        <Alert level="danger">
          Joukkueen moraali on huono.{" "}
          <Link to="/kriisipalaveri">Kriisipalaveri</Link> auttaisi.
        </Alert>
      )}
    </Stack>
  );
};

export default Current;
