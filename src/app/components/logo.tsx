import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/logocrash.png';

interface LogoProps {
    size?: number;
}

export default function Logo({ size }: LogoProps) {
    return (
        <Link href="/" className="flex items-center space-x-2">
            <Image src={logo} alt="Crashify Logo" width={size} height={60} />
        </Link>
    );
}
