import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, listAll } from "firebase/storage";
import { FIREBASE_CONFIG } from '../constants';

export function App() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<any>(null);
  const [files, setFiles] = useState<any>(null);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [percent, setPercent] = useState<any>(0);
  const app = initializeApp(FIREBASE_CONFIG);
  const provider = new GoogleAuthProvider();
  const auth = getAuth(app);
  const storage = getStorage(app);

  useEffect(() => {
    // const user = auth.currentUser;
    // console.log(user);
    setLoading(true);
    onAuthStateChanged(auth, user => {
      if (user) {
        // User is signed in.
        console.log('user', user);
        setUser(user);
        setLoading(false);

      } else {
        setLoading(false);
        // No user is signed in.
        console.log('No user');
      }
    });

    // Create a reference under which you want to list
    const listRef = ref(storage, 'files');

    // Find all the prefixes and items.
    listAll(listRef)
      .then((res) => {
        setFiles(res);
        res?.items?.map((item, index) => {
          getDownloadURL(item).then((url: any) => {
          fileUrls[index] = url;
            setFileUrls([...fileUrls]);
          })
        })
      

      }).catch((error) => {
        // Uh-oh, an error occurred!
      });
      
  }, []);

  const onClickSignIn = () => {
    signInWithRedirect(auth, provider);
  }

  const onClickSignOut = () => {
    signOut(auth).then(() => {
      alert('Sign-out successful!')
      setUser(null);
    }).catch((error) => {
      // An error happened.
    });
  }

  if (loading) {
    return (
      <div>
        Loading
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <button onClick={onClickSignIn}>Sign-in</button>
      </div>
    )
  }

  const onChangeFile = (event: any) => {
    setFile(event?.target?.files[0]);
  }

  const onClickUpload = () => {
    if (!file) {
      alert("Please choose a file first!");
    } else {
      const storageRef = ref(storage, `/files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
            const percent = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
 
            // update progress
            setPercent(percent);
        },
        (err) => console.log(err),
        () => {
            // download url
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                console.log(url);
            });
        }
    ); 
    }
  }

  return (
    <div>
      <button onClick={onClickSignOut}>Sign-out</button>
      <br />
      <br />
      <br />
      <br />
      <input type="file" name="file" accept="image/*" onChange={onChangeFile} />
      <br />
      <button onClick={onClickUpload}>Upload to Firebase</button>
      <br />
      <br />
      <p>{percent} "% done"</p>

      <br />
      <br />
      <p>Existing files</p>
      <div>
        {fileUrls?.map((url: any) => {
            return (<div>
              <img src={url} width="100" height="100" />
            </div>)
        })}
      </div>
    </div>
  );
}

export default App;