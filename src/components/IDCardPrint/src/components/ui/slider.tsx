import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("slider-root", className)}
    style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      touchAction: 'none',
      userSelect: 'none',
      alignItems: 'center'
    }}
    {...props}
  >
    <SliderPrimitive.Track 
      className="slider-track"
      style={{
        position: 'relative',
        height: '6px',
        width: '100%',
        flexGrow: 1,
        overflow: 'visible',
        borderRadius: '3px',
        background: '#d0d0d0',
        border: '1px solid #b0b0b0'
      }}
    >
      <SliderPrimitive.Range 
        className="slider-range"
        style={{
          position: 'absolute',
          height: '100%',
          background: 'hsl(210, 85%, 55%)',
          borderRadius: '3px',
          transition: 'width 0.1s ease'
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="slider-thumb"
      style={{
        display: 'block',
        width: '18px',
        height: '18px',
        backgroundColor: 'white',
        border: '2px solid hsl(210, 85%, 55%)',
        borderRadius: '50%',
        cursor: 'grab',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
        outline: 'none'
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
