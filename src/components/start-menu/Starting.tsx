import ManagerForm from "@/components/start-menu/ManagerForm";
import Box from "@/components/styled-system/Box";
import { AppMachineContext } from "@/context/app-machine-context";
import type { FC } from "react";

export const Starting: FC = () => {
  const app = AppMachineContext.useActorRef();

  const teams = AppMachineContext.useSelector(
    (state) => state.context.pending!.teams
  );

  const competitions = AppMachineContext.useSelector(
    (state) => state.context.pending!.competitions
  );

  return (
    <Box p={1}>
      <ManagerForm
        teams={teams}
        competitions={competitions}
        advance={(payload) => {
          app.send({ type: "ADD_MANAGER", payload });
        }}
      />
    </Box>
  );
};
