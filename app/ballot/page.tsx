'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../globals.css';

interface Team {
  id: number;
  str_team: string;
  str_badge_b64?: string;
  // Legacy fields for backward compatibility
  name?: string;
  school_name?: string;
  logo_url?: string;
}

interface SortableTeamProps {
  team: Team;
  rank?: number;
}

interface RankingPlaceholderProps {
  rank: number;
  team?: Team;
  onRemove?: (teamId: number) => void;
}

function SortableTeam({ team, rank }: SortableTeamProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Helper function to get image src - handles both data URI and base64 string formats
  const getImageSrc = () => {
    if (team.str_badge_b64) {
      // If it already starts with 'data:', use it directly
      if (team.str_badge_b64.startsWith('data:')) {
        return team.str_badge_b64;
      }
      // Otherwise, add the data URI prefix
      return `data:image/png;base64,${team.str_badge_b64}`;
    }
    return team.logo_url;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '15px',
        marginBottom: '10px',
        background: rank ? '#e8f4f8' : 'white',
        border: rank ? '2px solid #0066cc' : '1px solid #ddd',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'grab',
        boxShadow: rank ? '0 2px 8px rgba(0,102,204,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      {...attributes}
      {...listeners}
    >
      {rank && (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#0066cc',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            marginRight: '15px',
            flexShrink: 0,
          }}
        >
          {rank}
        </div>
      )}
      {(team.str_badge_b64 || team.logo_url) && (
        <img
          src={getImageSrc()}
          alt={team.str_team || team.name}
          style={{ width: '40px', height: '40px', marginRight: '15px', objectFit: 'contain' }}
        />
      )}
      <div>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>{team.str_team || team.name}</div>
        {team.school_name && team.school_name !== team.name && (
          <div style={{ fontSize: '14px', color: '#666' }}>{team.school_name}</div>
        )}
      </div>
    </div>
  );
}

function SortableTeamTile({ team }: SortableTeamProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Helper function to get image src - handles both data URI and base64 string formats
  const getImageSrc = () => {
    if (team.str_badge_b64) {
      // If it already starts with 'data:', use it directly
      if (team.str_badge_b64.startsWith('data:')) {
        return team.str_badge_b64;
      }
      // Otherwise, add the data URI prefix
      return `data:image/png;base64,${team.str_badge_b64}`;
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '15px',
        background: '#e8f4f8',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'grab',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      {team.str_badge_b64 && (
        <img
          src={getImageSrc() || ''}
          alt={team.str_team || team.name}
          style={{ width: '80px', height: '80px', marginBottom: '10px', objectFit: 'contain' }}
        />
      )}
      <div style={{ fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>
        {team.str_team || team.name}
      </div>
    </div>
  );
}

function RankingPlaceholder({ rank, team, onRemove }: RankingPlaceholderProps) {
  // Helper function to get image src - handles both data URI and base64 string formats
  const getImageSrc = () => {
    if (team?.str_badge_b64) {
      if (team.str_badge_b64.startsWith('data:')) {
        return team.str_badge_b64;
      }
      return `data:image/png;base64,${team.str_badge_b64}`;
    }
    return team?.logo_url;
  };

  if (team) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: team.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.3 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          padding: '15px',
          marginBottom: '10px',
          background: '#e8f4f8',
          border: '2px solid #0066cc',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          boxShadow: '0 2px 8px rgba(0,102,204,0.2)',
          position: 'relative',
        }}
      >
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center' }}
          {...attributes}
          {...listeners}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#0066cc',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              marginRight: '15px',
              flexShrink: 0,
            }}
          >
            {rank}
          </div>
          {(team.str_badge_b64 || team.logo_url) && (
            <img
              src={getImageSrc()}
              alt={team.str_team || team.name}
              style={{ width: '40px', height: '40px', marginRight: '15px', objectFit: 'contain' }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '16px' }}>{team.str_team || team.name}</div>
            {team.school_name && team.school_name !== team.name && (
              <div style={{ fontSize: '14px', color: '#666' }}>{team.school_name}</div>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove(team.id);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              flexShrink: 0,
              marginLeft: '10px',
              pointerEvents: 'auto',
              zIndex: 10,
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  // Empty placeholder - use droppable
  const { setNodeRef, isOver } = useDroppable({
    id: `placeholder-${rank}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '15px',
        marginBottom: '10px',
        background: isOver ? '#e8f4f8' : '#f0f0f0',
        border: isOver ? '2px dashed #0066cc' : '2px dashed #ccc',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        minHeight: '70px',
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#ccc',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          marginRight: '15px',
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
      <div style={{ color: '#999', fontStyle: 'italic' }}>Drag and drop team here</div>
    </div>
  );
}

export default function BallotPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [rankedTeams, setRankedTeams] = useState<(Team | undefined)[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Helper function to sort teams alphabetically
  const sortTeamsAlphabetically = (teamsToSort: Team[]): Team[] => {
    return [...teamsToSort].sort((a, b) => {
      const nameA = (a.str_team || a.name || '').toLowerCase();
      const nameB = (b.str_team || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Helper function to ensure the 25th slot team is returned to available teams if displaced
  const ensure25thSlotReturned = (newRanked: (Team | undefined)[], previousRanked: (Team | undefined)[]) => {
    // Check if the 25th slot (index 24) had a team before
    const previousTeamAt25 = previousRanked[24];
    const currentTeamAt25 = newRanked[24];
    
    // If there was a team at the 25th slot and it's no longer there (either empty or different team)
    if (previousTeamAt25 && (!currentTeamAt25 || currentTeamAt25.id !== previousTeamAt25.id)) {
      // Check if the previous team is still somewhere in the new rankings
      const isStillInRankings = newRanked.some(t => t && t.id === previousTeamAt25.id);
      
      // Only return to available if it's no longer in rankings at all
      // (If it was moved to a different position, it's still in rankings, so don't return it)
      if (!isStillInRankings) {
        setAvailableTeams((currentAvailable) => {
          const filtered = currentAvailable.filter(t => t.id !== previousTeamAt25.id);
          return sortTeamsAlphabetically([...filtered, previousTeamAt25]);
        });
      }
    }
    
    // Also check if there are any teams beyond the 25th slot (shouldn't happen, but handle it)
    const teamsBeyond25: Team[] = [];
    for (let i = 25; i < newRanked.length; i++) {
      if (newRanked[i]) {
        teamsBeyond25.push(newRanked[i]!);
        newRanked[i] = undefined;
      }
    }
    
    if (teamsBeyond25.length > 0) {
      setAvailableTeams((currentAvailable) => {
        const filtered = currentAvailable.filter(t => !teamsBeyond25.some(team => team.id === t.id));
        return sortTeamsAlphabetically([...filtered, ...teamsBeyond25]);
      });
    }
    
    return newRanked;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTeams();
  }, []);

  // Auto-hide warning after 3 seconds
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => {
        setWarning(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        const sortedTeams = sortTeamsAlphabetically(data.teams || []);
        setTeams(sortedTeams);
        setAvailableTeams(sortedTeams);
      } else if (response.status === 401) {
        router.push('/signin');
      } else {
        setError('Failed to load teams');
      }
    } catch (err) {
      setError('An error occurred while loading teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number | string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number | string;
    const overId = over.id as number | string;

    // Handle placeholder drops
    if (typeof overId === 'string' && overId.startsWith('placeholder-')) {
      const targetRank = parseInt(overId.replace('placeholder-', ''), 10) - 1; // Convert to 0-indexed
      
      // If dragging from available teams
      if (typeof activeId === 'number' && availableTeams.some(t => t.id === activeId)) {
        const activeTeam = availableTeams.find(t => t.id === activeId);
        if (!activeTeam) return;
        
        // Check if team is already in rankings (reordering vs adding new)
        const existingIndex = rankedTeams.findIndex(t => t && t.id === activeId);
        const isReordering = existingIndex >= 0;
        
        // Check if all 25 slots are occupied
        const occupiedSlots = rankedTeams.filter((t): t is Team => t !== undefined).length;
        
        const newRanked = [...rankedTeams];
        let teamToReturnToAvailable: Team | undefined;
        
        // Ensure array is long enough to include target position
        while (newRanked.length <= targetRank) {
          newRanked.push(undefined);
        }
        
        // If dropping on the 25th slot (index 24) and it's occupied, return that team to available
        if (targetRank === 24 && newRanked[24]) {
          teamToReturnToAvailable = newRanked[24];
          newRanked[24] = undefined;
        }
        // If all slots are occupied and this is a NEW team (not reordering), remove the 25th slot
        else if (occupiedSlots >= 25 && !isReordering) {
          // Find the last team (25th slot) - the team at the highest index
          // Work backwards to find the last defined team
          let lastTeamIdx = -1;
          for (let i = rankedTeams.length - 1; i >= 0; i--) {
            if (rankedTeams[i]) {
              teamToReturnToAvailable = rankedTeams[i];
              lastTeamIdx = i;
              break;
            }
          }
          
          if (teamToReturnToAvailable && lastTeamIdx >= 0) {
            // Remove the last team from rankings
            newRanked[lastTeamIdx] = undefined;
          }
        }
        
        // Remove team if already ranked (handle undefined values)
        if (isReordering) {
          // Team is already in rankings - clear its current position
          newRanked[existingIndex] = undefined;
        }
        
        // Replace the target slot (don't insert, which would shift other teams)
        newRanked[targetRank] = activeTeam;
        
        // Ensure the 25th slot team is returned if displaced
        const previousRanked = [...rankedTeams];
        const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
        setRankedTeams(finalRanked);
        
        // Update available teams: remove the active team and add back the last team if one was removed
        const updatedAvailable = availableTeams.filter(t => t.id !== activeId);
        if (teamToReturnToAvailable) {
          const filtered = updatedAvailable.filter(t => t.id !== teamToReturnToAvailable!.id);
          setAvailableTeams(sortTeamsAlphabetically([...filtered, teamToReturnToAvailable]));
        } else {
          setAvailableTeams(updatedAvailable);
        }
        return;
      }
      
      // If dragging from ranked teams (reordering within rankings)
      if (typeof activeId === 'number' && rankedTeams.some(t => t && t.id === activeId)) {
        const activeTeam = rankedTeams.find(t => t && t.id === activeId);
        if (!activeTeam) return;
        
        const oldIndex = rankedTeams.findIndex(t => t && t.id === activeId);
        const previousRanked = [...rankedTeams];
        const newRanked = [...rankedTeams];
        
        // Ensure array is long enough to include target position
        while (newRanked.length <= targetRank) {
          newRanked.push(undefined);
        }
        
        // If dropping on the 25th slot (index 24) and it's occupied (and not the same team), return that team to available
        let teamToReturnToAvailable: Team | undefined;
        if (targetRank === 24 && newRanked[24] && newRanked[24]!.id !== activeId) {
          teamToReturnToAvailable = newRanked[24];
          setAvailableTeams((currentAvailable) => {
            const filtered = currentAvailable.filter(t => t.id !== teamToReturnToAvailable!.id);
            return sortTeamsAlphabetically([...filtered, teamToReturnToAvailable!]);
          });
        }
        
        // Clear the old position
        newRanked[oldIndex] = undefined;
        
        // Replace the target slot (don't insert, which would shift other teams)
        newRanked[targetRank] = activeTeam;
        
        // Ensure the 25th slot team is returned if displaced
        const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
        setRankedTeams(finalRanked);
        return;
      }
    }

    // Handle team-to-team drops
    if (typeof activeId === 'number' && typeof overId === 'number') {
      const activeTeam = [...rankedTeams.filter((t): t is Team => t !== undefined), ...availableTeams].find(t => t.id === activeId);
      if (!activeTeam) return;

      // If dragging from available to ranked
      if (availableTeams.some(t => t.id === activeId) && rankedTeams.some(t => t && t.id === overId)) {
        // Check if team is already in rankings (reordering vs adding new)
        const existingIndex = rankedTeams.findIndex(t => t && t.id === activeId);
        const isReordering = existingIndex >= 0;
        
        // Check if all 25 slots are occupied
        const occupiedSlots = rankedTeams.filter((t): t is Team => t !== undefined).length;
        
        const overIndex = rankedTeams.findIndex(t => t && t.id === overId);
        const newRanked = [...rankedTeams];
        let teamToReturnToAvailable: Team | undefined;
        
        // If dropping on the 25th slot (index 24) and it's occupied, return that team to available
        if (overIndex === 24 && newRanked[24]) {
          teamToReturnToAvailable = newRanked[24];
          // Remove the active team from its current position if it's already in rankings
          if (isReordering) {
            newRanked[existingIndex] = undefined;
          }
          // Replace the slot instead of inserting
          newRanked[24] = activeTeam;
        }
        // If all slots are occupied and this is a NEW team (not reordering), remove the 25th slot
        else if (occupiedSlots >= 25 && !isReordering) {
          // Find the last team (25th slot) - the team at the highest index
          // Work backwards to find the last defined team
          let lastTeamIdx = -1;
          for (let i = rankedTeams.length - 1; i >= 0; i--) {
            if (rankedTeams[i]) {
              teamToReturnToAvailable = rankedTeams[i];
              lastTeamIdx = i;
              break;
            }
          }
          
          if (teamToReturnToAvailable && lastTeamIdx >= 0) {
            // Remove the last team from rankings
            newRanked[lastTeamIdx] = undefined;
          }
          newRanked.splice(overIndex, 0, activeTeam);
        } else {
          // Remove the active team from its current position if it's already in rankings
          if (isReordering) {
            newRanked[existingIndex] = undefined;
          }
          newRanked.splice(overIndex, 0, activeTeam);
        }
        
        // Ensure the 25th slot team is returned if displaced
        const previousRanked = [...rankedTeams];
        const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
        setRankedTeams(finalRanked);
        
        // Update available teams: remove the active team and add back the last team if one was removed
        const updatedAvailable = availableTeams.filter(t => t.id !== activeId);
        if (teamToReturnToAvailable) {
          const filtered = updatedAvailable.filter(t => t.id !== teamToReturnToAvailable!.id);
          setAvailableTeams(sortTeamsAlphabetically([...filtered, teamToReturnToAvailable]));
        } else {
          setAvailableTeams(updatedAvailable);
        }
      }
      // If dragging within ranked
      else if (rankedTeams.some(t => t && t.id === activeId)) {
        const oldIndex = rankedTeams.findIndex(t => t && t.id === activeId);
        const newIndex = rankedTeams.findIndex(t => t && t.id === overId);
        const previousRanked = [...rankedTeams];
        const newRanked = [...rankedTeams];
        let teamToReturnToAvailable: Team | undefined;
        
        // If dropping on the 25th slot (index 24) and it's occupied (and not the same team), return that team to available
        if (newIndex === 24 && newRanked[24] && newRanked[24]!.id !== activeId) {
          teamToReturnToAvailable = newRanked[24];
          // Move the active team to slot 24
          newRanked[oldIndex] = undefined;
          newRanked[24] = rankedTeams[oldIndex];
        } else {
          // Use arrayMove for normal reordering
          const movedRanked = arrayMove(rankedTeams, oldIndex, newIndex);
          for (let i = 0; i < movedRanked.length; i++) {
            newRanked[i] = movedRanked[i];
          }
        }
        
        // Ensure the 25th slot team is returned if displaced
        const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
        setRankedTeams(finalRanked);
        
        // If we returned a team to available, update the available teams list
        if (teamToReturnToAvailable) {
          setAvailableTeams((currentAvailable) => {
            const filtered = currentAvailable.filter(t => t.id !== teamToReturnToAvailable!.id);
            return sortTeamsAlphabetically([...filtered, teamToReturnToAvailable!]);
          });
        }
      }
      // If dragging from ranked to available
      else if (rankedTeams.some(t => t && t.id === activeId) && availableTeams.some(t => t.id === overId)) {
        const previousRanked = [...rankedTeams];
        const newRanked = rankedTeams.map(t => (t && t.id === activeId ? undefined : t));
        
        // Ensure the 25th slot team is returned if displaced
        const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
        setRankedTeams(finalRanked);
        
        // Filter out any existing team with the same ID to prevent duplicates
        const filtered = availableTeams.filter(t => t.id !== activeId);
        setAvailableTeams(sortTeamsAlphabetically([...filtered, activeTeam]));
      }
    }
  };

  const removeFromRanking = (teamId: number) => {
    setRankedTeams((currentRanked) => {
      const teamIndex = currentRanked.findIndex(t => t && t.id === teamId);
      if (teamIndex >= 0) {
        const team = currentRanked[teamIndex];
        if (team) {
          setAvailableTeams((currentAvailable) => {
            // Filter out any existing team with the same ID to prevent duplicates
            const filtered = currentAvailable.filter(t => t.id !== teamId);
            return sortTeamsAlphabetically([...filtered, team]);
          });
          // Set the slot to undefined instead of filtering, so no shifting occurs
          const previousRanked = [...currentRanked];
          const newRanked = [...currentRanked];
          newRanked[teamIndex] = undefined;
          
          // Ensure the 25th slot team is returned if displaced
          const finalRanked = ensure25thSlotReturned(newRanked, previousRanked);
          return finalRanked;
        }
      }
      return currentRanked;
    });
  };

  const handleSubmit = async () => {
    const validRankedTeams = rankedTeams.filter((t): t is Team => t !== undefined);
    if (validRankedTeams.length === 0) {
      setError('Please rank at least one team');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ballot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rankings: validRankedTeams.map((team, index) => ({
            teamId: team.id,
            rank: index + 1,
          })),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/rankings');
        }, 2000);
      } else if (response.status === 401) {
        router.push('/signin');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit ballot');
      }
    } catch (err) {
      setError('An error occurred while submitting your ballot');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', marginTop: '60px' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '36px' }}>Your Ballot</h1>
        <div>
          <Link href="/rankings" className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Rankings
          </Link>
          <Link href="/ballot-periods-2025" className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Ballot Periods
          </Link>
          <Link href="/account" className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Account
          </Link>
          <button
            onClick={async () => {
              const response = await fetch('/api/auth/signout', { method: 'POST' });
              if (response.ok) router.push('/');
            }}
            className="btn btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="error" style={{ padding: '15px', background: '#f8d7da', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {warning && (
        <div className="warning" style={{ padding: '15px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', marginBottom: '20px', color: '#856404' }}>
          {warning}
        </div>
      )}

      {success && (
        <div className="success" style={{ padding: '15px', background: '#d4edda', borderRadius: '6px', marginBottom: '20px' }}>
          Ballot submitted successfully! Redirecting to rankings...
        </div>
      )}

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
              Your Top 25 Rankings ({rankedTeams.filter((t): t is Team => t !== undefined).length}/25)
            </h2>
            <SortableContext 
              items={rankedTeams.filter((t): t is Team => t !== undefined).map(t => t.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div style={{ maxHeight: '600px', overflowY: 'auto', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                {Array.from({ length: 25 }, (_, i) => {
                  const rank = i + 1;
                  const team = rankedTeams[i];
                  return (
                    <RankingPlaceholder
                      key={team ? team.id : `placeholder-${rank}`}
                      rank={rank}
                      team={team}
                      onRemove={removeFromRanking}
                    />
                  );
                })}
              </div>
            </SortableContext>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={handleSubmit}
                className="btn"
                style={{ minWidth: '150px' }}
                disabled={isSubmitting || rankedTeams.filter((t): t is Team => t !== undefined).length === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Cast Ballot'}
              </button>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
              Available Teams ({availableTeams.length})
            </h2>
            <SortableContext items={availableTeams.map(t => t.id)} strategy={rectSortingStrategy}>
              <div style={{ maxHeight: '600px', overflowY: 'auto', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {availableTeams.map((team) => (
                    <SortableTeamTile key={team.id} team={team} />
                  ))}
                </div>
              </div>
            </SortableContext>
          </div>
        </div>
        <DragOverlay>
          {activeId && typeof activeId === 'number' ? (
            (() => {
              const draggedTeam = [...rankedTeams.filter((t): t is Team => t !== undefined), ...availableTeams].find(t => t.id === activeId);
              if (!draggedTeam) return null;
              
              const getImageSrc = () => {
                if (draggedTeam.str_badge_b64) {
                  if (draggedTeam.str_badge_b64.startsWith('data:')) {
                    return draggedTeam.str_badge_b64;
                  }
                  return `data:image/png;base64,${draggedTeam.str_badge_b64}`;
                }
                return draggedTeam.logo_url;
              };

              const isRanked = rankedTeams.some(t => t && t.id === activeId);
              
              if (isRanked) {
                return (
                  <div
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      background: '#e8f4f8',
                      border: '2px solid #0066cc',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'grabbing',
                      boxShadow: '0 4px 12px rgba(0,102,204,0.4)',
                      width: '400px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#0066cc',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        marginRight: '15px',
                        flexShrink: 0,
                      }}
                    >
                      {rankedTeams.findIndex(t => t && t.id === activeId) + 1}
                    </div>
                    {(draggedTeam.str_badge_b64 || draggedTeam.logo_url) && (
                      <img
                        src={getImageSrc()}
                        alt={draggedTeam.str_team || draggedTeam.name}
                        style={{ width: '40px', height: '40px', marginRight: '15px', objectFit: 'contain' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {draggedTeam.str_team || draggedTeam.name}
                      </div>
                      {draggedTeam.school_name && draggedTeam.school_name !== draggedTeam.name && (
                        <div style={{ fontSize: '14px', color: '#666' }}>{draggedTeam.school_name}</div>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    style={{
                      padding: '15px',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'grabbing',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      width: '150px',
                    }}
                  >
                    {draggedTeam.str_badge_b64 && (
                      <img
                        src={getImageSrc() || ''}
                        alt={draggedTeam.str_team || draggedTeam.name}
                        style={{ width: '80px', height: '80px', marginBottom: '10px', objectFit: 'contain' }}
                      />
                    )}
                    <div style={{ fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>
                      {draggedTeam.str_team || draggedTeam.name}
                    </div>
                  </div>
                );
              }
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
