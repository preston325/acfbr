'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import AppNav from '../components/AppNav';
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
  const [rankedTeams, setRankedTeams] = useState<(Team | undefined)[]>(new Array(25).fill(undefined));
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [currentPeriodName, setCurrentPeriodName] = useState<string | null>(null);
  const [pollOpenDt, setPollOpenDt] = useState<string | null>(null);
  const [pollCloseDt, setPollCloseDt] = useState<string | null>(null);
  const [availableSearch, setAvailableSearch] = useState('');

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
    const initializeData = async () => {
      const loadedTeams = await fetchTeams();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 50));
      await loadSavedRankings(loadedTeams);
      await fetchCurrentPeriod();
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Helper function to check if polls are currently open
  const isPollOpen = (): boolean => {
    if (!pollOpenDt || !pollCloseDt) {
      return false;
    }
    const now = new Date();
    const pollOpen = new Date(pollOpenDt);
    const pollClose = new Date(pollCloseDt);
    return now >= pollOpen && now <= pollClose;
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch('/api/ballot-periods/current');
      if (response.ok) {
        const data = await response.json();
        if (data.period && data.period.period_name) {
          setCurrentPeriodName(data.period.period_name);
          setPollOpenDt(data.period.poll_open_dt || null);
          setPollCloseDt(data.period.poll_close_dt || null);
        }
      }
    } catch (err) {
      console.error('Error fetching current period:', err);
      // Don't set error state for this, just use default button text
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        const sortedTeams = sortTeamsAlphabetically(data.teams || []);
        setTeams(sortedTeams);
        // Don't set availableTeams here - let loadSavedRankings handle it
        // This prevents overwriting the filtered list
        return sortedTeams;
      } else if (response.status === 401) {
        router.push('/signin');
        return [];
      } else {
        setError('Failed to load teams');
        return [];
      }
    } catch (err) {
      setError('An error occurred while loading teams');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedRankings = async (loadedTeams?: Team[]) => {
    try {
      console.log('Loading saved rankings...');
      const response = await fetch('/api/ballot');
      console.log('Ballot API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const savedRankings = data.rankings || [];
        
        console.log('Saved rankings from API:', savedRankings);
        console.log('Number of saved rankings:', savedRankings.length);
        
        // Use provided teams or current state
        const currentTeams = loadedTeams && loadedTeams.length > 0 ? loadedTeams : teams;
        console.log('Current teams available:', currentTeams.length);
        
        if (savedRankings.length > 0 && currentTeams.length > 0) {
          // Sort rankings by rank to process them in order
          const sortedRankings = [...savedRankings].sort((a, b) => a.rank - b.rank);
          
          // Start with all teams in available and empty rankings
          let newRankedTeams: (Team | undefined)[] = new Array(25).fill(undefined);
          let newAvailableTeams = [...currentTeams];
          
          // Process each saved ranking
          sortedRankings.forEach((ranking: { teamId: number; rank: number; team: Team }) => {
            const targetRank = ranking.rank - 1; // Convert to 0-indexed
            
            console.log(`Processing ranking: teamId=${ranking.teamId}, rank=${ranking.rank}, targetRank=${targetRank}`, ranking.team);
            
            if (targetRank >= 0 && targetRank < 25 && ranking.team && ranking.team.id) {
              // Check if team is already in rankings at a different position
              const existingRankIndex = newRankedTeams.findIndex(t => t && t.id === ranking.teamId);
              
              if (existingRankIndex >= 0) {
                // Team is already ranked - clear its current position
                console.log(`Team ${ranking.teamId} already at rank ${existingRankIndex + 1}, clearing it`);
                newRankedTeams[existingRankIndex] = undefined;
              }
              
              // Remove team from available teams if it exists there
              const teamIndex = newAvailableTeams.findIndex(t => t.id === ranking.teamId);
              if (teamIndex >= 0) {
                console.log(`Removing team ${ranking.teamId} from available teams`);
                newAvailableTeams = newAvailableTeams.filter(t => t.id !== ranking.teamId);
              }
              
              // If target slot is occupied by a different team, move that team back to available
              if (newRankedTeams[targetRank] && newRankedTeams[targetRank]!.id !== ranking.teamId) {
                const displacedTeam = newRankedTeams[targetRank];
                console.log(`Displacing team ${displacedTeam!.id} from rank ${targetRank + 1}`);
                if (displacedTeam) {
                  // Only add back if not already in available
                  if (!newAvailableTeams.some(t => t.id === displacedTeam.id)) {
                    newAvailableTeams.push(displacedTeam);
                  }
                }
              }
              
              // Place team in target rank (use the team object from the ranking data)
              console.log(`Placing team ${ranking.teamId} at rank ${targetRank + 1}`);
              newRankedTeams[targetRank] = ranking.team;
            } else {
              console.warn(`Invalid ranking data: targetRank=${targetRank}, team=`, ranking.team);
            }
          });
          
          // Sort available teams alphabetically
          newAvailableTeams = sortTeamsAlphabetically(newAvailableTeams);
          
          const rankedCount = newRankedTeams.filter((t): t is Team => t !== undefined).length;
          console.log(`Auto-populated ${rankedCount} ranked teams:`, newRankedTeams.filter((t): t is Team => t !== undefined));
          console.log(`Remaining ${newAvailableTeams.length} available teams`);
          
          // Update state
          setRankedTeams(newRankedTeams);
          setAvailableTeams(newAvailableTeams);
        } else {
          console.log('No saved rankings found or teams not loaded', {
            savedRankingsLength: savedRankings.length,
            currentTeamsLength: currentTeams.length
          });
          // If no saved rankings, set all teams as available
          if (currentTeams.length > 0) {
            setAvailableTeams(sortTeamsAlphabetically(currentTeams));
          }
        }
      } else if (response.status === 401) {
        router.push('/signin');
      } else {
        const errorText = await response.text();
        console.error('Failed to load saved rankings:', response.status, response.statusText, errorText);
        // On error, ensure availableTeams is set
        if (loadedTeams && loadedTeams.length > 0) {
          setAvailableTeams(sortTeamsAlphabetically(loadedTeams));
        } else if (teams.length > 0) {
          setAvailableTeams(sortTeamsAlphabetically(teams));
        }
      }
    } catch (err) {
      // Log error details
      console.error('Error loading saved rankings:', err);
      // On error, ensure availableTeams is set
      if (loadedTeams && loadedTeams.length > 0) {
        setAvailableTeams(sortTeamsAlphabetically(loadedTeams));
      } else if (teams.length > 0) {
        setAvailableTeams(sortTeamsAlphabetically(teams));
      }
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

  const handleSave = async () => {
    // Build rankings array using actual slot positions (not filtered indices)
    const rankings = rankedTeams
      .map((team, index) => {
        if (team) {
          return {
            teamId: team.id,
            rank: index + 1, // rank is the slot position (1-indexed)
          };
        }
        return null;
      })
      .filter((r): r is { teamId: number; rank: number } => r !== null);

    if (rankings.length === 0) {
      setWarning('At least one team needs to be selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch('/api/ballot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rankings,
        }),
      });

      if (response.ok) {
        setSuccess('Rankings Saved Successfully');
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else if (response.status === 401) {
        router.push('/signin');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save ballot');
      }
    } catch (err) {
      setError('An error occurred while saving your ballot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSearchLower = availableSearch.trim().toLowerCase();
  const filteredAvailableTeams =
    availableSearchLower === ''
      ? availableTeams
      : availableTeams.filter((team) => {
          const teamName = (team.str_team || team.name || '').toLowerCase();
          // If only 1 character, match teams that start with that letter (like SQL 'a%')
          // If 2+ characters, match teams that contain the search text anywhere (like SQL '%search%')
          if (availableSearchLower.length === 1) {
            return teamName.startsWith(availableSearchLower);
          } else {
            return teamName.includes(availableSearchLower);
          }
        });

  const handleSubmit = async () => {
    // Build rankings array using actual slot positions (not filtered indices)
    const rankings = rankedTeams
      .map((team, index) => {
        if (team) {
          return {
            teamId: team.id,
            rank: index + 1, // rank is the slot position (1-indexed)
          };
        }
        return null;
      })
      .filter((r): r is { teamId: number; rank: number } => r !== null);

    if (rankings.length === 0) {
      setError('Please rank at least one team');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/ballot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rankings,
        }),
      });

      if (response.ok) {
        setSuccess('Ballot Cast Successfully');
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
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
      <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', marginTop: '20px' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '36px' }}>My Ballot</h1>
        <AppNav />
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
          {success}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', margin: 0 }}>
                My Top 25 Rankings ({rankedTeams.filter((t): t is Team => t !== undefined).length}/25)
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  className="btn"
                  style={{ minWidth: '140px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Rankings'}
                </button>
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: 'help',
                  }}
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '0';
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#0066cc',
                      color: 'white',
                      textAlign: 'center',
                      lineHeight: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ?
                  </span>
                  <div
                    data-tooltip
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      background: '#333',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s',
                      zIndex: 1000,
                      width: '280px',
                      whiteSpace: 'normal',
                      textAlign: 'center',
                    }}
                  >
                    Save Rankings does not cast your ballot. It only saves your rankings to be worked on later.
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        border: '6px solid transparent',
                        borderTopColor: '#333',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleSubmit}
                  className="btn"
                  style={{ minWidth: '150px' }}
                  disabled={isSubmitting || rankedTeams.filter((t): t is Team => t !== undefined).length === 0 || !isPollOpen()}
                >
                  {isSubmitting 
                    ? 'Submitting...' 
                    : currentPeriodName 
                      ? `Cast ${currentPeriodName} Ballot` 
                      : 'Cast Ballot'}
                </button>
                {!isPollOpen() && currentPeriodName && (
                  <div
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      cursor: 'help',
                    }}
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.currentTarget.querySelector('[data-tooltip]') as HTMLElement;
                      if (tooltip) tooltip.style.opacity = '0';
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#ffc107',
                        color: '#856404',
                        textAlign: 'center',
                        lineHeight: '28px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                      }}
                    >
                      ⚠
                    </span>
                    <div
                      data-tooltip
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: '#333',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s',
                        zIndex: 1000,
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                    >
                      Polls are not open for {currentPeriodName}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          border: '6px solid transparent',
                          borderTopColor: '#333',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {pollOpenDt && pollCloseDt && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                  Polls open: {new Date(pollOpenDt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })} to {new Date(pollCloseDt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', flexShrink: 0 }}>
              Available Teams ({availableTeams.length})
            </h2>
            <div style={{ flexShrink: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff' }}>
              <svg
                aria-hidden
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginLeft: '12px' }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="available-teams-search"
                type="text"
                placeholder="Search teams..."
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '10px 12px 10px 8px',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                }}
                aria-label="Filter available teams"
              />
            </div>
            <SortableContext items={filteredAvailableTeams.map((t) => t.id)} strategy={rectSortingStrategy}>
              <div style={{ maxHeight: '600px', overflowY: 'auto', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {filteredAvailableTeams.map((team) => (
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
