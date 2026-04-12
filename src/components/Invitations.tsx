import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import Box from "./styled-system/Box";
import tournamentList from "../data/tournaments";
import Markdown from "react-markdown";
import Button from "./form/Button";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { requestAcceptInvitation } from "../ducks/invitation";
import { activeManager, activeManagersInvitations } from "@/data/selectors";

const Invitations = () => {
  const manager = useAppSelector(activeManager);

  const invitations = useAppSelector(activeManagersInvitations);
  const dispatch = useAppDispatch();

  return (
    <HeaderedPage>
      <Header back />

      <ManagerInfo details />

      <Box p={1}>
        <h2>Turnauskutsut</h2>

        {invitations.map((i, index) => {
          const t = tournamentList[i.tournament];
          return (
            <div key={index}>
              <h3>{t.name}</h3>

              <Markdown>{t.description(t.award)}</Markdown>

              <Button
                block
                onClick={() =>
                  dispatch(
                    requestAcceptInvitation({ manager: manager.id, id: i.id })
                  )
                }
                disabled={i.participate}
              >
                Hyväksy turnauskutsu
              </Button>
            </div>
          );
        })}
      </Box>
    </HeaderedPage>
  );
};

export default Invitations;
