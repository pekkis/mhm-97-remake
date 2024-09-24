import type { StoryDefault, Story } from "@ladle/react";
import { Button } from "./Button";
import { Paragraph } from "./Paragraph";
import { EnforcedColorScheme } from "./EnforcedColorScheme";

export default {
  title: "Enforced Color Scheme",
} satisfies StoryDefault;

export const Default: Story = () => {
  return (
    <div>
      <div>
        <Paragraph>Some text following user choice in theme</Paragraph>
        <Button>This button will follow the set theme</Button>
      </div>

      <EnforcedColorScheme colorScheme="dark">
        <Paragraph>Some text following user choice in theme</Paragraph>
        <Button>This button is always in dark theme</Button>
      </EnforcedColorScheme>

      <EnforcedColorScheme colorScheme="light">
        <Paragraph>Some text following user choice in theme</Paragraph>
        <Button>This button is always in light theme</Button>
      </EnforcedColorScheme>
    </div>
  );
};
