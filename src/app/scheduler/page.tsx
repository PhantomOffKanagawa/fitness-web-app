// page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/authContext";
import { Pencil, Trash2, GripHorizontal } from "lucide-react";
import Header from "@/components/Header";

interface WorkoutSplit {
  id: string;
  name: string;
  recovery: number;
}

interface ScheduledWorkout {
  id: string;
  splitId: string;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WorkoutScheduler() {
  const { authUser } = useAuth();
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [schedule, setSchedule] = useState<{
    [key: string]: ScheduledWorkout[];
  }>({});
  const [newSplit, setNewSplit] = useState({ name: "", recovery: 1 });
  const [editingSplit, setEditingSplit] = useState<WorkoutSplit | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const trashTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    daysOfWeek.forEach((day) => {
      if (!schedule[day]) {
        setSchedule((prev) => ({ ...prev, [day]: [] }));
      }
    });
    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    if (!authUser?.uid) return;
    const docRef = doc(db, "workouts", authUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setSplits(data.splits || []);
      setSchedule(data.schedule || {});
    }
  };

  const saveToFirebase = async () => {
    if (!authUser?.uid) return;
    await setDoc(doc(db, "workouts", authUser.uid), {
      splits,
      schedule,
    });
  };

  const addOrUpdateSplit = () => {
    if (editingSplit) {
      setSplits(
        splits.map((s) =>
          s.id === editingSplit.id
            ? {
                ...editingSplit,
                name: newSplit.name,
                recovery: newSplit.recovery,
              }
            : s
        )
      );
      setEditingSplit(null);
    } else {
      const newSplitObj: WorkoutSplit = {
        id: Date.now().toString(),
        name: newSplit.name,
        recovery: newSplit.recovery,
      };
      setSplits([...splits, newSplitObj]);
    }
    setNewSplit({ name: "", recovery: 1 });
    saveToFirebase();
  };

  const deleteSplit = (splitId: string) => {
    setSplits(splits.filter((s) => s.id !== splitId));
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach((day) => {
        newSchedule[day] = newSchedule[day].filter(
          (w) => w.splitId !== splitId
        );
      });
      return newSchedule;
    });
    saveToFirebase();
  };

  const checkRecoveryConflict = (day: string, splitId: string) => {
    const dayIndex = daysOfWeek.indexOf(day);
    const split = splits.find((s) => s.id === splitId);
    if (!split) return false;

    // Check days before, including wrap-around
    for (let i = 1; i <= split.recovery; i++) {
      const checkIndex = (dayIndex - i + 7) % 7;
      const dayWorkouts = schedule[daysOfWeek[checkIndex]] || [];
      if (dayWorkouts.some((w) => w.splitId === splitId)) return true;
    }

    // Check days after, including wrap-around
    for (let i = 1; i <= split.recovery; i++) {
      const checkIndex = (dayIndex + i) % 7;
      const dayWorkouts = schedule[daysOfWeek[checkIndex]] || [];
      if (dayWorkouts.some((w) => w.splitId === splitId)) return true;
    }

    return false;
  };

  const onDragStart = (result: any) => {
    if (result.source.droppableId === "splits") return;
    setIsDragging(true);
  };

  const onDragEnd = (result: any) => {
    setIsDragging(false);
    if (trashTimeoutRef.current) {
      clearTimeout(trashTimeoutRef.current);
    }

    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle dropping back to splits list - delete the copy
    if (destination.droppableId === "splits") {
      if (source.droppableId !== "splits") {
        // Remove the workout from schedule
        setSchedule((prev) => {
          const newSchedule = { ...prev };
          newSchedule[source.droppableId].splice(source.index, 1);
          return newSchedule;
        });
      }
      return;
    }

    // Handle dropping to trash
    if (destination.droppableId === "trash") {
        console.log("Deleting workout");
      if (source.droppableId === "splits") {
        // Don't delete original splits when dragged to trash
        return;
      }
      // Remove the workout from schedule
      setSchedule((prev) => {
        const newSchedule = { ...prev };
        newSchedule[source.droppableId].splice(source.index, 1);
        return newSchedule;
      });
      return;
    }

    // Handle drag from splits to schedule
    if (source.droppableId === "splits") {
      const splitId = draggableId;
      const destDay = destination.droppableId;

      const newWorkout: ScheduledWorkout = {
        id: `${splitId}-${Date.now()}`,
        splitId: splitId,
      };

      setSchedule((prev) => ({
        ...prev,
        [destDay]: [...prev[destDay], newWorkout],
      }));
    } else {
      // Handle moving within schedule
      const sourceDay = source.droppableId;
      const destDay = destination.droppableId;

      const newSchedule = { ...schedule };
      const [removed] = newSchedule[sourceDay].splice(source.index, 1);
      newSchedule[destDay].splice(destination.index, 0, removed);

      setSchedule(newSchedule);
    }
    saveToFirebase();
  };

  return (
    <div className="min-h-screen bg-base-100 overflow-x-hidden w-full">
      <Header />
      <main className="container mx-auto p-4 pt-20">
        <div className="mb-8 bg-base-200 text-base-content p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Workout Splits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Split Name</span>
              </label>
              <input
                type="text"
                placeholder="Split Name"
                className="input input-bordered"
                value={newSplit.name}
                onChange={(e) =>
                  setNewSplit({ ...newSplit, name: e.target.value })
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Recovery Days</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={newSplit.recovery}
                onChange={(e) =>
                  setNewSplit({
                    ...newSplit,
                    recovery: parseInt(e.target.value),
                  })
                }
                min="1"
                max="7"
              />
            </div>
          </div>
          <button 
            className="btn btn-primary bg-primary" 
            onClick={addOrUpdateSplit}
            disabled={!newSplit.name.trim() || isNaN(newSplit.recovery) || newSplit.recovery < 0}
          >
            {editingSplit ? "Update Split" : "Add Split"}
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <div className="mb-8">
            <Droppable droppableId="splits" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-wrap gap-2 bg-base-200 text-base-content p-3 rounded-lg"
                >
                  {splits.map((split, index) => (
                    <Draggable
                      key={split.id}
                      draggableId={split.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative group bg-secondary text-secondary-content p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span {...provided.dragHandleProps} className="cursor-grab">
                              <GripHorizontal size={16} />
                            </span>
                            <span className="font-medium">
                              {split.name}
                            </span>
                            <span className="text-sm opacity-75">
                              ({split.recovery} days)
                            </span>
                            <div className="ml-auto flex gap-2">
                              <button
                                className="btn btn-ghost btn-xs hover:bg-primary-focus"
                                onClick={() => {
                                  setEditingSplit(split);
                                  setNewSplit({
                                    name: split.name,
                                    recovery: split.recovery,
                                  });
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-xs hover:bg-primary-focus"
                                onClick={() => deleteSplit(split.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="bg-base-200 text-base-content p-2 rounded-lg">
                <h3 className="font-bold m-2">{day}</h3>
                <Droppable droppableId={day}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[100px] p-2 overflow-x-hidden ${snapshot.isDraggingOver ? "bg-base-300 rounded-lg" : ""}`}
                    >
                      {schedule[day]?.map((workout, index) => {
                        const split = splits.find(
                          (s) => s.id === workout.splitId
                        );
                        const hasConflict = checkRecoveryConflict(
                          day,
                          workout.splitId
                        );
                        return (
                          <Draggable
                            key={workout.id}
                            draggableId={workout.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 mb-2 rounded ${
                                  hasConflict
                                    ? "bg-warning text-warning-content"
                                    : "bg-primary text-primary-content"
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                {split?.name}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
          <div className="transition-opacity duration-300" style={{ opacity: isDragging ? 1 : 0, pointerEvents: isDragging ? 'auto' : 'none' }}>
            <Droppable droppableId="trash">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`fixed bottom-0 left-0 right-0 h-24 bg-error/80 backdrop-blur-sm 
                  flex items-center justify-center transition-all duration-300 w-full
                  ${snapshot.isDraggingOver ? "bg-error" : ""}`}
                  style={{
                    opacity: snapshot.isDraggingOver ? 1 : 0.8,
                    transform: `translateY(${
                      snapshot.isDraggingOver ? "0" : "20%"
                    })`,
                  }}
                >
                  <div className="text-error-content text-xl font-bold flex items-center gap-2">
                    <Trash2 size={24} />
                    Drop here to delete
                  </div>
                  <div className="hidden">
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
