import React, { useCallback, useEffect } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.6;
const MIN_TRANSLATE_Y = 0;

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
    const translateY = useSharedValue(MIN_TRANSLATE_Y);
    const context = useSharedValue({ y: 0 });

    const scrollTo = useCallback(
        (destination: number) => {
            'worklet';
            translateY.value = withTiming(destination, {
                duration: 300,
                easing: Easing.out(Easing.cubic),
            });
        },
        [translateY],
    );

    useEffect(() => {
        if (visible) {
            scrollTo(MAX_TRANSLATE_Y);
        } else {
            scrollTo(MIN_TRANSLATE_Y);
        }
    }, [visible, scrollTo]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = Math.max(
                MAX_TRANSLATE_Y,
                Math.min(MIN_TRANSLATE_Y, context.value.y + event.translationY),
            );
        })
        .onEnd(() => {
            if (translateY.value > MAX_TRANSLATE_Y / 2) {
                scrollTo(MIN_TRANSLATE_Y);
                runOnJS(onClose)();
            } else {
                scrollTo(MAX_TRANSLATE_Y);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!visible) return null;

    return (
        <>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <Animated.View style={[styles.container, animatedStyle]}>
                <GestureDetector gesture={gesture}>
                    <View style={styles.handleArea}>
                        <View style={styles.handle} />
                    </View>
                </GestureDetector>
                <View style={styles.content}>
                    {children}
                </View>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 20,
    },
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: SCREEN_HEIGHT,
        height: SCREEN_HEIGHT * 0.6,
        backgroundColor: '#FAF5E8',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        zIndex: 30,
        paddingHorizontal: 20,
        shadowColor: '#2A4B7C',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    handleArea: {
        paddingTop: 10,
        paddingBottom: 8,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    content: {
        flex: 1,
    },
});
