'use client'
import AudioPlayer from "@/app/components/AudioPlayer";
import {storage, db, auth} from "@/app/firebase";
import {collection} from "firebase/firestore";
import {useEffect, useState} from "react";
import {getDocs} from "firebase/firestore";
import AppLayout from "@/app/layout/AppLayout";

export default function Home() {

    const [audioUrl, setAudioUrl] = useState(null);

    const fetchDictations = async () => {
        try {
            const dictationsSnapshot = await getDocs(collection(db, 'dictations'));
            const dictation = dictationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })).pop();
            setAudioUrl(dictation.audioUrl);
            console.log(audioUrl);
        } catch (error) {
            console.error('Error retrieving dictations:', error);
        }
    };
    useEffect(() => {
        fetchDictations();
    }, [fetchDictations]); // Add dependency array to prevent infinite loops


    return (
        <div>
            {audioUrl && (
                <AudioPlayer audio={audioUrl}/>
            )}
        </div>
    );
}
