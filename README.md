Specialised IDE for game narrative design. The core function is to visualize and edit a branching narrative structure across a strict temporal grid (28 Days × 4 Time Slots).

Unlike free-form node editors, this canvas is a coordinate system where X = Day and Y = Time. A node's position directly dictates its data (AtDay, AtTime).

Nodes represent game scenarios with specific metadata (LoadInfo, EndInfo) and relationships (Next, Previous).

"Noodles" (lines) represent the narrative flow.

The system acts as a guardrail, preventing logical errors (e.g., time paradoxes) and ensuring data integrity for the game engine.
