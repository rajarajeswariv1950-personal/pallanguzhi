import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { FadeSlideIn } from '@/components/anim/FadeSlideIn';
import { tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

export interface FaqItemProps {
  question: string;
  answer: string;
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  const rotate = useSharedValue(0);

  const toggle = () => {
    tapFeedback();
    rotate.value = withTiming(open ? 0 : 1, { duration: 200 });
    setOpen((v) => !v);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 90}deg` }],
  }));

  return (
    <Card onPress={toggle} accessibilityLabel={question}>
      <View style={styles.row}>
        <AppText variant="title" style={styles.question}>
          {question}
        </AppText>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-forward" size={20} color={theme.colors.primaryLight} />
        </Animated.View>
      </View>
      {open ? (
        <FadeSlideIn offset={8} duration={260}>
          <AppText variant="body" muted style={styles.answer}>
            {answer}
          </AppText>
        </FadeSlideIn>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  question: { flex: 1 },
  answer: { marginTop: theme.spacing.md },
});
