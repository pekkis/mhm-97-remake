import type { StoryDefault, Story } from "@ladle/react";
import { Button } from "ids";

export default {
  title: "Button",
} satisfies StoryDefault;

export const Default: Story = () => <Button>Hip hurraa sanoi peksu</Button>;
