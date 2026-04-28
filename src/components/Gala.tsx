import News from "./news/News";
import StickyMenu from "./StickyMenu";
import AdvancedHeaderedPage from "./ui/AdvancedHeaderedPage";

import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";

const Gala = () => {
  const news = useGameContext((ctx) => ctx.news.news);

  return (
    <AdvancedHeaderedPage
      stickyMenu={<StickyMenu forward="Jo riittää lätinä, asiaan!" />}
    >
      <Box p="md">
        <h2>Loppuottelugaala</h2>

        <News news={news} />
      </Box>
    </AdvancedHeaderedPage>
  );
};

export default Gala;
