import News from "./news/News";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";

const Gala = () => {
  const news = useGameContext((ctx) => ctx.news.news);

  return (
    <HeaderedPage>
      <Header forward="Jo riittää lätinä, asiaan!" />

      <Box p="md">
        <h2>Loppuottelugaala</h2>

        <News news={news} />
      </Box>
    </HeaderedPage>
  );
};

export default Gala;
